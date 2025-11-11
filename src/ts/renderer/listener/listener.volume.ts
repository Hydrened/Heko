import App from "./../app.js";
import ListenerManager from "./listener.js";
import * as Elements from "./../utils/utils.elements.js";

export default class ListenerVolumeManager {
    private volume: number = 0;
    private oldVolume: number = 0;

    // INIT
    constructor(private app: App, private main: ListenerManager, private audioElement: HTMLAudioElement) {
        this.initEvents();
    }

    private initEvents(): void {
        Elements.songControls.volume.slider.addEventListener("input", (e: Event) => {
            const sliderValue: number = parseFloat(Elements.songControls.volume.slider.value);
            this.setVolume(sliderValue);
        });

        Elements.songControls.volume.toggleButton.addEventListener("click", () => this.toggleMuteButton());
    }

    public load(): void {
        const settings: Settings = this.app.settings.get();
        this.setVolume(settings.song.volume);
        this.refreshVolumeSlider();
    }

    // EVENTS
    private refreshVolumeLogo(): void {
        const volumeIndex: number = ((this.volume <= 0) ? 0 : (this.volume < 75) ? 1 : 2);
        Elements.songControls.volume.toggleButton.setAttribute("volume", String(volumeIndex));
    }

    private refreshVolumeSlider(): void {
        Elements.songControls.volume.slider.value = String(this.volume);
    }

    // BUTTON EVENTS
    public toggleMuteButton(): void {
        if (this.audioElement.volume != 0) {
            this.oldVolume = this.volume;
            this.setVolume(0);
        }
        else {
            this.setVolume(this.oldVolume);
            this.oldVolume = 0;
        }

        this.refreshVolumeSlider();
    }

    // GETTERS
    public getVolume(): number {
        return this.volume;
    }

    // SETTERS
    public setVolume(percentageVolume: number) {
        let volume: number = 0;

        switch (this.app.settings.preferences.get().volumeEasing) {
            case 0:
                volume = (percentageVolume * 0.01);
                break;

            case 1:
                volume = Math.pow((percentageVolume * 0.01), 2);
                break;

            case 2:
                volume = (1 - Math.pow(1 - (percentageVolume * 0.01), 2));
                break;

            default: return;
        }

        this.audioElement.volume = volume;
        this.volume = percentageVolume;

        Elements.songControls.volume.slider.value = String(percentageVolume);

        this.refreshVolumeLogo();
    }
};
