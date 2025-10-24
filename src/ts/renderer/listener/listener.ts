import ListenerRefreshManager from "./listener.refresh.js";
import ListenerQueueManager from "./listener.queue.js";
import ListenerVolumeManager from "./listener.volume.js";
import ListenerEditManager from "./listener.edit.js";
import App from "./../app.js";
import * as Elements from "./../utils/utils.elements.js";

export default class ListenerManager {
    private audioElement: HTMLAudioElement;

    private refreshManager: ListenerRefreshManager;
    private queueManager: ListenerQueueManager;
    private volumeManager: ListenerVolumeManager;
    private editManager: ListenerEditManager;

    // INIT
    constructor(private app: App) {
        this.audioElement = new Audio();

        this.refreshManager = new ListenerRefreshManager(this.app, this);
        this.queueManager = new ListenerQueueManager(this.app, this, this.audioElement);
        this.volumeManager = new ListenerVolumeManager(this.app, this, this.audioElement);
        this.editManager = new ListenerEditManager(this.app, this, this.audioElement);

        this.initEvents();
    }

    private initEvents(): void {
        this.initSongControlButtonEvent();
        this.initSongProgressbarEvents();
    }

    private initSongControlButtonEvent(): void {
        interface ElementEvent { element: Element; event: () => void; };
        const elementEvents: ElementEvent[] = [
            { element: Elements.songControls.buttons.togglePlayButton!, event: async () => await this.queueManager.togglePlayButton() },
            { element: Elements.songControls.buttons.previousButton!, event: () => this.queueManager.previousButton() },
            { element: Elements.songControls.buttons.nextButton!, event: () => this.queueManager.nextButton() },
            { element: Elements.songControls.buttons.toggleShuffleButton!, event: async () => await this.queueManager.toggleShuffleButton() },
            { element: Elements.songControls.buttons.toggleLoopButton!, event: async () => await this.queueManager.toggleLoopButton() },
        ];

        elementEvents.forEach((elementEvent: ElementEvent) => {
            elementEvent.element.addEventListener("click", () => elementEvent.event());
        });
    }

    private initSongProgressbarEvents(): void {
        Elements.songControls.progressBar.slider!.addEventListener("input", () => {

        });
    }

    // EVENTS
    public refresh(): void {
        this.refreshManager.refresh(this.queueManager.getCurrentSong());
    }

    public async loggedIn(): Promise<void> {
        await this.queueManager.load();
        await this.editManager.load();
        await this.volumeManager.load();
    }

    // GETTERS
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
