import App from "./../app.js";
import ListenerManager from "./listener.js";
import * as Bridge from "./../utils/utils.bridge.js";
import * as Functions from "./../utils/utils.functions.js";
import * as Elements from "./../utils/utils.elements.js";

export default class ListenerEventManager {
    constructor(private app: App, private main: ListenerManager) {
        this.initEvents();
        this.initRefreshLoop();
    }

    private initEvents(): void {
        this.initSongControlButtonEvent();
        this.initSongProgressbarEvents();
        this.initShortcuts();
    }

    private initSongControlButtonEvent(): void {
        interface ElementEvent { element: Element; event: () => void; };
        const elementEvents: ElementEvent[] = [
            { element: Elements.songControls.buttons.togglePlayButton, event: () => this.main.togglePlayButton() },
            { element: Elements.songControls.buttons.previousButton, event: () => this.main.previousButton() },
            { element: Elements.songControls.buttons.nextButton, event: () => this.main.nextButton() },
            { element: Elements.songControls.buttons.toggleShuffleButton, event: () => this.main.toggleShuffleButton() },
            { element: Elements.songControls.buttons.toggleLoopButton, event: () => this.main.toggleLoopButton() },
        ];

        elementEvents.forEach((elementEvent: ElementEvent) => {
            elementEvent.element.addEventListener("click", () => elementEvent.event());
        });

        Bridge.mainEvents.onPreviousButton(() => this.main.previousButton());
        Bridge.mainEvents.onPlayButton(() => this.main.togglePlayButton());
        Bridge.mainEvents.onNextButton(() => this.main.nextButton());
    }

    private initSongProgressbarEvents(): void {
        Elements.songControls.progressBar.slider.addEventListener("input", (e: Event) => {
            const currentSong: Song | null = this.main.getCurrentSong();
            if (currentSong == null) {
                return;
            }

            const percentage: number = Number(Elements.songControls.progressBar.slider.value);
            const newCurrentTime: number = (currentSong.duration * percentage / 100);

            const audioElement: HTMLAudioElement = this.main.getAudioElement();
            audioElement.currentTime = newCurrentTime;
            audioElement.volume = 0;
        });

        Elements.songControls.progressBar.slider.addEventListener("mouseup", (e: Event) => {
            const currentSong: Song | null = this.main.getCurrentSong();
            if (currentSong == null) {
                return;
            }

            this.main.setVolume(this.main.getVolume());
        });
    }

    private initRefreshLoop(): void {
        const currentSong: Song | null = this.main.getCurrentSong();
        const audioElement: HTMLAudioElement = this.main.getAudioElement();

        const positionText: string = ((currentSong == null) ? "\u00A0" : Functions.formatDuration(audioElement.currentTime));
        Elements.songControls.progressBar.position.textContent = positionText;

        const durationText: string = ((currentSong == null) ? "\u00A0" : Functions.formatDuration(currentSong!.duration));
        Elements.songControls.progressBar.duration.textContent = durationText;

        const sliderValue: string = ((currentSong == null) ? "0" : String(audioElement.currentTime / currentSong.duration * 100));
        Elements.songControls.progressBar.slider.value = sliderValue;

        setTimeout(() => this.initRefreshLoop(), 100);
    }

    private initShortcuts(): void {
        document.addEventListener("keydown", (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName == "INPUT") {
                return;
            }

            if (e.key == " ") {
                this.app.listenerManager.togglePlayButton();
            }

            else if (e.key == "ArrowLeft" && e.ctrlKey) {
                this.app.listenerManager.previousButton();
            }

            else if (e.key == "ArrowRight" && e.ctrlKey) {
                this.app.listenerManager.nextButton();
            }

            else if (e.key == "ArrowLeft" && !e.ctrlKey) {
                const audioElement: HTMLAudioElement = this.app.listenerManager.getAudioElement();
                if (audioElement.src == "") {
                    return;
                }
                audioElement.currentTime = Math.max(0, audioElement.currentTime - 5);
            }

            else if (e.key == "ArrowRight" && !e.ctrlKey) {
                const audioElement: HTMLAudioElement = this.app.listenerManager.getAudioElement();
                if (audioElement.src == "") {
                    return;
                }
                audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + 5);
            }

            else if (/^[0-9]$/.test(e.key)) {
                const multiplier: number = (Number(e.key) * 0.1);
                
                const audioElement: HTMLAudioElement = this.app.listenerManager.getAudioElement();
                if (audioElement.src == "") {
                    return;
                }
                audioElement.currentTime = (audioElement.duration * multiplier);
            }

            else if (e.key.toLowerCase() == "s" && e.ctrlKey) {
                this.app.listenerManager.toggleShuffleButton();
            }

            else if (e.key.toLowerCase() == "l" && e.ctrlKey) {
                this.app.listenerManager.toggleLoopButton();
            }

            else if (e.key == "ArrowDown" && !e.ctrlKey) {
                const currentVolume: number = this.app.listenerManager.getVolume();
                this.app.listenerManager.setVolume(currentVolume - 5);
            }

            else if (e.key == "ArrowUp" && !e.ctrlKey) {
                const currentVolume: number = this.app.listenerManager.getVolume();
                this.app.listenerManager.setVolume(currentVolume + 5);
            }

            else if (e.key.toLowerCase() == "m" && !e.ctrlKey) {
                this.app.listenerManager.toggleMuteButton();
            }
        });

        Bridge.mainEvents.onVolumeDown(() => {
            const currentVolume: number = this.app.listenerManager.getVolume();
            this.app.listenerManager.setVolume(currentVolume - 5);
        });

        Bridge.mainEvents.onVolumeUp(() => {
            const currentVolume: number = this.app.listenerManager.getVolume();
            this.app.listenerManager.setVolume(currentVolume + 5);
        });
    }
};
