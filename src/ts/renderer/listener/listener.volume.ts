import App from "./../app.js";
import ListenerManager from "./listener.js";
import * as Elements from "./../utils/utils.elements.js";

export default class ListenerVolumeManager {
    private volume: number = 0;
    private oldVolume: number = 0;

    // INIT
    constructor(private app: App, private listener: ListenerManager, private audioElement: HTMLAudioElement) {
        this.initEvents();
    }

    private initEvents(): void {
        Elements.songControls.volume.slider!.addEventListener("input", (e: Event) => {
            const sliderValue: number = parseFloat((Elements.songControls.volume.slider as HTMLInputElement).value);
            this.setVolume(sliderValue);
        });

        Elements.songControls.volume.toggleButton!.addEventListener("click", () => {
            if (this.audioElement.volume != 0) {
                this.oldVolume = this.volume;
                this.setVolume(0);
            }
            else {
                this.setVolume(this.oldVolume);
                this.oldVolume = 0;
            }

            this.refreshVolumeSlider();
        });
    }

    public load(): void {
        const settings: UserSettings = this.app.account.getSettings();
        this.setVolume(settings.volume);
        this.refreshVolumeSlider();
    }

    // EVENTS
    private refreshVolumeLogo(): void {
        const volumeIndex: number = ((this.volume <= 0) ? 0 : (this.volume < 75) ? 1 : 2);
        Elements.songControls.volume.toggleButton!.setAttribute("volume", String(volumeIndex));
    }

    private refreshVolumeSlider(): void {
        (Elements.songControls.volume.slider as HTMLInputElement).value = String(this.volume);
    }

    // GETTERS
    public getVolume(): number {
        return this.volume;
    }

    // SETTERS
    private setVolume(percentageVolume: number) {
        this.volume = percentageVolume;

        const volume: number = Math.pow((percentageVolume * 0.01), 2);
        this.audioElement.volume = volume;

        this.refreshVolumeLogo();
    }
};
