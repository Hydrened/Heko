import ListenerSongManager from "./listener.song.js";
import ListenerRefreshManager from "./listener.refresh.js";
import ListenerQueueManager from "./listener.queue.js";
import ListenerVolumeManager from "./listener.volume.js";
import ListenerEditManager from "./listener.edit.js";
import App from "./../app.js";
import * as Elements from "./../utils/utils.elements.js";

export default class ListenerManager {
    private songManager: ListenerSongManager;
    private refreshManager: ListenerRefreshManager;
    private queueManager: ListenerQueueManager;
    private volumeManager: ListenerVolumeManager;
    private editManager: ListenerEditManager;

    constructor(private app: App) {
        this.songManager = new ListenerSongManager(this.app, this);
        this.refreshManager = new ListenerRefreshManager(this.app, this);
        this.queueManager = new ListenerQueueManager(this.app, this);
        this.volumeManager = new ListenerVolumeManager(this.app, this);
        this.editManager = new ListenerEditManager(this.app, this);

        this.initEvents();
    }

    private initEvents(): void {
        interface ElementEvent { element: Element | null; event: () => void; };
        const elementEvents: ElementEvent[] = [
            { element: Elements.songControls.buttons.togglePlayButton, event: async () => await this.togglePlayButton() },
            { element: Elements.songControls.buttons.previousButton, event: () => this.previousButton() },
            { element: Elements.songControls.buttons.nextButton, event: () => this.nextButton() },
            { element: Elements.songControls.buttons.toggleShuffleButton, event: () => this.toggleShuffleButton() },
            { element: Elements.songControls.buttons.toggleLoopButton, event: () => this.toggleLoopButton() },
        ];

        elementEvents.forEach((elementEvent: ElementEvent) => {
            if (elementEvent.element == null) {
                return this.app.throwError("Can't init listener events: One of the control button elements is null.");
            }

            elementEvent.element.addEventListener("click", () => elementEvent.event());
        });

        if (Elements.songControls.progressBar.slider == null) {
            return this.app.throwError("Can't init listener events: Progressbar slider element is null.");
        }

        Elements.songControls.progressBar.slider.addEventListener("input", () => {

        });
    }

    private async togglePlayButton(): Promise<void> {
        const isPlaying: boolean = this.getPlayState();

        const currentListeningPlaylist: Playlist | null = this.getCurrentListeningPlaylist();
        const currentOpenedPlaylist: Playlist | null = this.app.playlistManager.getCurrentOpenedPlaylist();

        if (!isPlaying) {
            const cantInit: boolean = (currentListeningPlaylist == null && currentOpenedPlaylist == null);
            if (cantInit) {
                return;
            }

            const hasToInit: boolean = (currentListeningPlaylist == null && currentOpenedPlaylist != null);
            if (hasToInit) {
                await this.queueManager.init(currentOpenedPlaylist!);
            }
        }
        
        this.songManager.togglePlayState();
    }

    private previousButton(): void {
        
    }

    private nextButton(): void {
        
    }

    private toggleShuffleButton(): void {
        
    }

    private toggleLoopButton(): void {
        
    }

    private getButtonState(element: Element | null, prop: string): boolean {
        const errorBase: string = `Can't get ${prop} state`;

        if (element == null) {
            this.app.throwError(`${errorBase}: Toggle ${prop} button element is null.`);
            return false;
        }

        if (!element.hasAttribute(prop)) {
            this.app.throwError(`${errorBase}: Toggle ${prop} button has no ${prop} attribute.`);
            return false;
        }

        return (element.getAttribute(prop) == "true");
    }

    public getPlayState(): boolean {
        return this.getButtonState(Elements.songControls.buttons.togglePlayButton, "playing");
    }

    public getShuffleState(): boolean {
        return this.getButtonState(Elements.songControls.buttons.toggleShuffleButton, "shuffle");
    }

    public getLoopState(): boolean {
        return this.getButtonState(Elements.songControls.buttons.toggleLoopButton, "loop");
    }

    public getCurrentListeningPlaylist(): Playlist | null {
        return this.queueManager.getCurrentPlaylist();
    }

    public getCurrentSong(): Song | null {
        return this.songManager.currentSong;
    }
};
