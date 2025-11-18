import App from "./../app.js";
import ListenerManager from "./listener.js";
import * as Elements from "./../utils/utils.elements.js";

export default class ListenerSettingsManager {
    private speed: number = 1;

    // INIT
    constructor(private app: App, private main: ListenerManager, private audioElement: HTMLAudioElement) {
        this.initEvents();
    }

    private initEvents(): void {
        this.audioElement.addEventListener("playing", () => this.apply());

        Elements.songSettings.speedInput.addEventListener("input", () => {
            const value: number = Number(Elements.songSettings.speedInput.value);
            Elements.songSettings.speed.textContent = `${value.toFixed(2)}x`;
            
            this.speed = value;
            this.apply();
        });
    }

    public load(): void {
        const settings: Settings = this.app.settings.get();
        this.speed = settings.song.speed;
        this.apply();

        Elements.songSettings.speedInput.value = String(this.speed);
        Elements.songSettings.speedInput.dispatchEvent(new Event("input"));
    }

    // EVENTS
    private apply(): void {
        this.audioElement.playbackRate = this.speed;
    }

    // GETTERS
    public getSpeed(): number {
        return this.speed;
    }
};
