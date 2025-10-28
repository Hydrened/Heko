import App from "./../app.js";
import ListenerManager from "./listener.js";
import * as Functions from "./../utils/utils.functions.js";
import * as Elements from "./../utils/utils.elements.js";

export default class ListenerEventManager {
    constructor(private app: App, private listener: ListenerManager) {
        this.initEvents();
        this.initRefreshLoop();
    }

    private initEvents(): void {
        this.initSongControlButtonEvent();
        this.initSongProgressbarEvents();
    }

    private initSongControlButtonEvent(): void {
        interface ElementEvent { element: Element; event: () => void; };
        const elementEvents: ElementEvent[] = [
            { element: Elements.songControls.buttons.togglePlayButton!, event: async () => await this.listener.togglePlayButton() },
            { element: Elements.songControls.buttons.previousButton!, event: () => this.listener.previousButton() },
            { element: Elements.songControls.buttons.nextButton!, event: () => this.listener.nextButton() },
            { element: Elements.songControls.buttons.toggleShuffleButton!, event: () => this.listener.toggleShuffleButton() },
            { element: Elements.songControls.buttons.toggleLoopButton!, event: () => this.listener.toggleLoopButton() },
        ];

        elementEvents.forEach((elementEvent: ElementEvent) => {
            elementEvent.element.addEventListener("click", () => elementEvent.event());
        });
    }

    private initSongProgressbarEvents(): void {
        Elements.songControls.progressBar.slider!.addEventListener("input", (e: Event) => {
            const currentSong: Song | null = this.listener.getCurrentSong();
            if (currentSong == null) {
                return;
            }

            const percentage: number = Number((Elements.songControls.progressBar.slider as HTMLInputElement).value);
            const newCurrentTime: number = (currentSong.duration * percentage / 100);

            const audioElement: HTMLAudioElement = this.listener.getAudioElement();
            audioElement.currentTime = newCurrentTime;
        });
    }

    private initRefreshLoop(): void {
        const currentSong: Song | null = this.listener.getCurrentSong();
        const audioElement: HTMLAudioElement = this.listener.getAudioElement();

        const positionText: string = ((currentSong == null) ? "\u00A0" : Functions.formatDuration(audioElement.currentTime));
        Elements.songControls.progressBar.position!.textContent = positionText;

        const durationText: string = ((currentSong == null) ? "\u00A0" : Functions.formatDuration(currentSong!.duration));
        Elements.songControls.progressBar.duration!.textContent = durationText;

        const sliderValue: string = ((currentSong == null) ? "0" : String(audioElement.currentTime / currentSong.duration * 100));
        (Elements.songControls.progressBar.slider as HTMLInputElement).value = sliderValue;

        setTimeout(() => this.initRefreshLoop(), 100);
    }
};
