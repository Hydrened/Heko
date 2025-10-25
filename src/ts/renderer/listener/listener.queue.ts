import ListenerManager from "./listener.js";
import App from "./../app.js";
import AppPath from "./../utils/utils.app-path.js";
import * as Functions from "./../utils/utils.functions.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Elements from "./../utils/utils.elements.js";

export default class ListenerQueueManager {
    private queue: Queue = [];
    private currentQueueIndex: number = 0;
    private manuallyAddedToQueue: Queue = [];

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
            Elements.songControls.buttons.nextButton!.dispatchEvent(new Event("click"));
        });
    }

    public load(): void {
        const settings: UserSettings = this.app.account.getSettings();
        this.setShuffle(settings.shuffle);
        this.setLoop(settings.loop);
    }

    public reset(): void {
        this.queue = [];
        this.currentQueueIndex = 0;
        this.manuallyAddedToQueue = [];

        this.currentListeningPlaylist = null;
        this.currentSongs = null;

        this.setPlaying(false);
        this.setShuffle(false);
        this.setLoop(false);
    }

    // QUEUE EVENTS
    public async init(playlist: Playlist, firstSong: Song | null): Promise<void> {
        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return this.app.throwError("Can't init queue: User is not logged in.");
        }

        this.currentListeningPlaylist = playlist;

        const getSongsFromPlaylistReqRes: any = await Requests.song.getFromPlaylist(userData.id, userData.token, this.currentListeningPlaylist.id);
        if (!getSongsFromPlaylistReqRes.success) {
            return this.app.throwError(`Can't init queue: ${getSongsFromPlaylistReqRes.error}`);
        }

        this.currentSongs = (getSongsFromPlaylistReqRes.songs as Song[]);
        if (this.currentSongs.length == 0) {
            this.currentListeningPlaylist = null;
            return;
        }

        this.recreate(firstSong);

        this.setPlaying(true);

        const currentSong: Song | null = this.getCurrentSong();
        if (currentSong == null) {
            return this.app.throwError("Can't set audio src: Current song is null.");
        }

        this.setAudioSrc(currentSong);
    }

    private recreate(firstSong: Song | null): void {
        if (!this.canPlay()) {
            return;
        }

        this.currentQueueIndex = 0;
        this.queue = [];

        if (firstSong != null) {
            this.queue.push(firstSong);
        }

        const songs: Song[] = structuredClone(this.currentSongs!);

        for (let i = 0; i < songs.length; i++) {
            this.fillQueue();
        }
    }

    private fillQueue(): void {
        const songs: Song[] = structuredClone(this.currentSongs!);

        if (this.loop) {
            const previousSong: Song = ((this.queue.length == 0) ? songs[0] : this.queue[this.queue.length - 1]);
            this.queue.push(previousSong);
            return;
        }

        if (this.shuffle) {
            const randomSong: Song = Functions.randomValueFromArray<Song>(songs);
            this.queue.push(randomSong);
            return;
        }

        const previousSong: Song | null = ((this.queue.length == 0) ? null : this.queue[this.queue.length - 1]);
        if (previousSong == null) {
            this.queue.push(songs[0]);
            return;
        }

        const songIndex: number = songs.findIndex((song: Song) => song.id == previousSong.id);
        if (songIndex == -1) {
            return this.app.throwError("Can't fill queue: Can't find last song index.");
        }

        const nextIndex: number = ((songIndex + 1) % songs.length);
        const nextSong: Song = songs[nextIndex];
        this.queue.push(nextSong);

        this.logQueue();
    }

    public addSong(song: Song): void {
        this.manuallyAddedToQueue.push(song);
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
                return await this.init(currentOpenedPlaylist!, null);
            }
        }

        if (this.currentSongs?.length == 0) {
            return;
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

        const previousSong: Song | null = this.getCurrentSong();
        if (previousSong == null) {
            return this.app.throwError("Can't go to previous song: Previous song is null");
        }

        this.setAudioSrc(previousSong);
    }

    public nextButton(): void {
        if (!this.canPlay()) {
            return;
        }

        if (this.manuallyAddedToQueue.length > 0) {
            this.queue.splice(this.currentQueueIndex + 1, 0, this.manuallyAddedToQueue[0]);
            this.manuallyAddedToQueue.shift();
        }

        this.currentQueueIndex++;

        if (this.currentSongs!.length == 1) {
            this.recreate(null);
            return;
        }

        const nextSong: Song | null = this.getCurrentSong();
        if (nextSong == null) {
            return this.app.throwError("Can't go to next song: Next song is null");
        }

        this.setAudioSrc(nextSong);

        const queueSize: number = this.queue.length - this.currentQueueIndex;
        if (queueSize < this.currentSongs!.length + 1) {
            this.fillQueue();
        }
    }

    public toggleShuffleButton(): void {
        this.setShuffle(!this.shuffle);
        this.recreate(this.getCurrentSong());
    }

    public toggleLoopButton(): void {
        this.setLoop(!this.loop);
        this.recreate(this.getCurrentSong());
    }

    // GETTERS
    public getAudioElement(): HTMLAudioElement {
        return this.audioElement;
    }

    public getCurrentListeningPlaylist(): Playlist | null {
        return this.currentListeningPlaylist;
    }

    public getCurrentSong(): Song | null {
        if (this.currentQueueIndex >= this.queue.length) {
            return null;
        }

        return this.queue[this.currentQueueIndex];
    }

    private canPlay(): boolean {
        const inPlaylist: boolean = (this.currentListeningPlaylist != null && this.currentSongs != null);
        if (!inPlaylist) {
            return false;
        }

        return (this.currentSongs!.length != 0);
    }

    // SETTERS
    private setAudioSrc(song: Song): void {
        this.audioElement.src = `${AppPath}/songs/${song.fileName}`;
        this.audioElement.play();
        this.listener.refresh();
    }

    private setPlaying(state: boolean): void {
        this.playing = state;
        this.setButtonState(Elements.songControls.buttons.togglePlayButton, state, "playing");
        (this.playing) ? this.audioElement.play() : this.audioElement.pause();
    }

    private setShuffle(state: boolean): void {
        this.shuffle = state;
        this.setButtonState(Elements.songControls.buttons.toggleShuffleButton, state, "shuffle");
    }

    private setLoop(state: boolean): void {
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

    // DEBUG
    private logQueue(): void {
        return;

        console.log("----------------------------------");

        const currentSong: Song | null = this.getCurrentSong();
        if (currentSong == null) {
            this.app.throwError("Can't log queue: Current song is null.");
        }

        console.log(`Current song: ${currentSong!.title}`);

        console.log(`Next songs:`);
        this.queue.slice(this.currentQueueIndex).forEach((song: Song, index: number) => {
            console.log(`${index + 1}: ${song.title}`);
        });
    }
};
