import App from "./../app.js";
import ListenerManager from "./listener.js";

export default class ListenerEditManager {
    private speed: number = 1;

    // INIT
    constructor(private app: App, private main: ListenerManager, private audioElement: HTMLAudioElement) {
        this.initEvents();
    }

    private initEvents(): void {
        this.audioElement.addEventListener("playing", () => this.apply());

        // slider event
    }

    public load(): void {
        const settings: Settings = this.app.settings.get();
        this.speed = settings.song.speed;

        // set slider to this.speed
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
