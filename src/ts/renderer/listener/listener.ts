import App from "./../app.js";
import ListenerRefreshManager from "./listener.refresh.js";
import ListenerQueueManager from "./listener.queue.js";
import ListenerVolumeManager from "./listener.volume.js";
import ListenerEditManager from "./listener.edit.js";
import ListenerEventManager from "./listener.events.js";

export default class ListenerManager {
    private readonly audioElement: HTMLAudioElement;

    private readonly refreshManager: ListenerRefreshManager;
    private readonly queueManager: ListenerQueueManager;
    private readonly volumeManager: ListenerVolumeManager;
    private readonly editManager: ListenerEditManager;
    private readonly eventManager: ListenerEventManager;

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

    public refreshQueue(): void {
        this.queueManager.refresh();
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

    public initQueue(playlist: Playlist, firstSong: Song | null = null): void {
        this.queueManager.init(playlist, firstSong);
    }

    public addSongToQueue(song: Song): void {
        this.queueManager.addSong(song);
    }

    // BUTTON EVENTS
    public togglePlayButton(): void {
        this.queueManager.togglePlayButton();
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

    public toggleMuteButton(): void {
        this.volumeManager.toggleMuteButton();
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

    // SETTERS
    public setVolume(percentageVolume: number): void {
        this.volumeManager.setVolume(Math.max(0, Math.min(100, percentageVolume)));
    }
};
