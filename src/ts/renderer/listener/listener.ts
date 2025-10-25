import ListenerRefreshManager from "./listener.refresh.js";
import ListenerQueueManager from "./listener.queue.js";
import ListenerVolumeManager from "./listener.volume.js";
import ListenerEditManager from "./listener.edit.js";
import ListenerEventManager from "./listener.events.js";
import App from "./../app.js";

export default class ListenerManager {
    private audioElement: HTMLAudioElement;

    private refreshManager: ListenerRefreshManager;
    private queueManager: ListenerQueueManager;
    private volumeManager: ListenerVolumeManager;
    private editManager: ListenerEditManager;
    private eventManager: ListenerEventManager;

    // INIT
    constructor(private app: App) {
        this.audioElement = new Audio();

        this.refreshManager = new ListenerRefreshManager(this.app, this);
        this.queueManager = new ListenerQueueManager(this.app, this, this.audioElement);
        this.volumeManager = new ListenerVolumeManager(this.app, this, this.audioElement);
        this.editManager = new ListenerEditManager(this.app, this, this.audioElement);
        this.eventManager = new ListenerEventManager(this.app, this);
    }

    // EVENTS
    public refresh(): void {
        const currentSong: Song | null = this.queueManager.getCurrentSong();
        this.refreshManager.refresh(currentSong);   
    }

    public loggedIn(): void {
        this.queueManager.load();
        this.editManager.load();
        this.volumeManager.load();
    }

    public loggedOut(): void {
        this.audioElement.src = "";
        this.refreshManager.refresh(null);
        this.queueManager.reset();
    }

    public async initQueue(playlist: Playlist, firstSong: Song | null): Promise<void> {
        await this.queueManager.init(playlist, firstSong);
    }

    public addSongToQueue(song: Song): void {
        this.queueManager.addSong(song);
    }

    // BUTTON EVENTS
    public async togglePlayButton(): Promise<void> {
        await this.queueManager.togglePlayButton();
    }

    public previousButton(): void {
        this.queueManager.previousButton();
    }

    public nextButton(): void {
        this.queueManager.nextButton();
    }

    public toggleShuffleButton(): void {
        this.queueManager.toggleShuffleButton();
    }

    public toggleLoopButton(): void {
        this.queueManager.toggleLoopButton();
    }

    // GETTERS
    public getAudioElement(): HTMLAudioElement {
        return this.audioElement;
    }

    public getCurrentListeningPlaylist(): Playlist | null {
        return this.queueManager.getCurrentListeningPlaylist();
    }

    public getCurrentSong(): Song | null {
        return this.queueManager.getCurrentSong();
    }

    public getShuffleState(): boolean {
        return this.queueManager.getShuffleState();
    }

    public getLoopState(): boolean {
        return this.queueManager.getLoopState();
    }

    public getSpeed(): number {
        return this.editManager.getSpeed();
    }

    public getVolume(): number {
        return this.volumeManager.getVolume();
    }
};
