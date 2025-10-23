import ListenerManager from "./listener.js";
import App from "./../app.js";
import AppPath from "./../utils/utils.app-path.js";
import * as Functions from "./../utils/utils.functions.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Elements from "./../utils/utils.elements.js";

export default class ListenerQueueManager {
    private queue: Queue = [];
    private currentQueueIndex: number = 0;
    private historySize: number = 0;

    private currentListeningPlaylist: Playlist | null = null;
    private currentSongs: Song[] | null = null;

    private playing: boolean = false;
    private shuffle: boolean = false;
    private loop: boolean = false;

    // INIT
    constructor(private app: App, private listener: ListenerManager, private audioElement: HTMLAudioElement) {
        this.initEvents();
    }

    private initEvents(): void {
        this.audioElement.addEventListener("ended", () => {
            if (Elements.songControls.buttons.nextButton == null) {
                return this.app.throwError("Can't go to next song: Next song button element is null.");
            }

            Elements.songControls.buttons.nextButton.dispatchEvent(new Event("click"));
        });
    }

    public async load(): Promise<void> {
        const settings: UserSettings = this.app.account.getSettings();
        await this.setShuffle(settings.shuffle);
        await this.setLoop(settings.loop);
    }

    // QUEUE EVENTS
    private async init(playlist: Playlist): Promise<void> {
        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return this.app.throwError("Can't init queue: User is not logged in.");
        }

        this.currentListeningPlaylist = structuredClone(playlist);

        const getSongsFromPlaylistReqRes: any = await Requests.song.getFromPlaylist(userData.id, userData.token, this.currentListeningPlaylist.id);
        if (!getSongsFromPlaylistReqRes.success) {
            return this.app.throwError(`Caan't init queue: ${getSongsFromPlaylistReqRes.error}`);
        }

        this.currentSongs = (getSongsFromPlaylistReqRes.songs as Song[]);
        this.recreate();

        this.setPlaying(true);
        this.setAudioSrc(this.getCurrentSong());
    }

    private recreate(): void {
        if (!this.canPlay()) {
            return;
        }

        const songs: Song[] = structuredClone(this.currentSongs!);

        if (this.loop) {
            const currentSong = this.queue[this.currentQueueIndex] ?? songs[0];
            this.queue = songs.map(() => currentSong);
            return;
        }

        if (this.shuffle) {
            this.queue = songs.map(() => Functions.randomValueFromArray<Song>(songs));
        }
        else {
            this.queue = songs;
        }
    }

    private fillQueue(): void {
        if (!this.canPlay()) {
            return;
        }

        const songs: Song[] = structuredClone(this.currentSongs!);
        const currentLastSong: Song = this.queue[this.queue.length - 1];
        
        if (this.loop) {
            this.queue.push(currentLastSong);
            return;
        }

        if (this.shuffle) {
            this.queue.push(Functions.randomValueFromArray<Song>(songs));
        }
        else {
            const songToAddIndex: number = songs.findIndex((song: Song) => song.id == currentLastSong.id);
            if (songToAddIndex == -1) {
                return this.app.throwError("Can't fill queue: Current song was not found.");
            }

            const nextIndex = ((songToAddIndex + 1) % songs.length);
            this.queue.push(songs[nextIndex]);
        }
    }

    // BUTTON EVENTS
    public async togglePlayButton(): Promise<void> {
        const currentOpenedPlaylist: Playlist | null = this.app.playlistManager.getCurrentOpenedPlaylist();

        if (!this.playing) {
            const cantInit: boolean = (this.currentListeningPlaylist == null && currentOpenedPlaylist == null);
            if (cantInit) {
                return;
            }

            const hasToInit: boolean = (this.currentListeningPlaylist == null && currentOpenedPlaylist != null);
            if (hasToInit) {
                return await this.init(currentOpenedPlaylist!);
            }
        }

        this.setPlaying(!this.playing);
    }

    public previousButton(): void {
        if (!this.canPlay()) {
            return;
        }

        if (this.audioElement.currentTime > 5) {
            this.audioElement.currentTime = 0;
            return;
        }

        this.currentQueueIndex = Math.max(0, this.currentQueueIndex - 1);
        this.setAudioSrc(this.getCurrentSong());
    }

    public nextButton(): void {
        if (!this.canPlay()) {
            return;
        }

        this.currentQueueIndex++;
        this.setAudioSrc(this.getCurrentSong());

        this.historySize = Math.max(this.historySize, this.currentQueueIndex);
        const queueSize: number = this.queue.length - this.historySize;

        if (queueSize != this.currentSongs!.length) {
            this.fillQueue();
        }
    }

    public async toggleShuffleButton(): Promise<void> {
        await this.setShuffle(!this.shuffle);
        this.recreate();
    }

    public async toggleLoopButton(): Promise<void> {
        await this.setLoop(!this.loop);
        this.recreate();
    }

    // GETTERS
    public getAudioElement(): HTMLAudioElement {
        return this.audioElement;
    }

    public getCurrentSong(): Song {
        if (this.currentQueueIndex >= this.queue.length) {
            this.app.throwError("Can't get current song: Current queue index is out of range.");
        }

        return this.queue[this.currentQueueIndex];
    }

    private canPlay(): boolean {
        const inPlaylist: boolean = (this.currentListeningPlaylist != null && this.currentSongs != null);
        if (!inPlaylist) {
            return false;
        }

        return (this.currentSongs!.length != 0)
    }

    // SETTERS
    private setAudioSrc(song: Song): void {
        this.audioElement.src = `${AppPath}/songs/${song.fileName}`;
        (this.playing) ? this.audioElement.play() : this.audioElement.pause();
        this.listener.refresh();
    }

    private setPlaying(state: boolean): void {
        this.playing = state;
        this.setButtonState(Elements.songControls.buttons.togglePlayButton, state, "playing");
        (this.playing) ? this.audioElement.play() : this.audioElement.pause();
    }

    private async setShuffle(state: boolean): Promise<void> {
        this.shuffle = state;
        this.setButtonState(Elements.songControls.buttons.toggleShuffleButton, state, "shuffle");
    }

    private async setLoop(state: boolean): Promise<void> {
        this.loop = state;
        this.setButtonState(Elements.songControls.buttons.toggleLoopButton, state, "loop");
    }

    private setButtonState(element: Element | null, state: boolean, prop: string): void {
        if (element == null) {
            return this.app.throwError("Can't toggle button: Button element is null.");
        }

        element.setAttribute(prop, String(state));
    }

    public getShuffleState(): boolean {
        return this.shuffle;
    }

    public getLoopState(): boolean {
        return this.loop;
    }
};
