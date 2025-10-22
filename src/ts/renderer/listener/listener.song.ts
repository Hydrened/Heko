import ListenerManager from "./listener.js";
import App from "./../app.js";
import * as Elements from "./../utils/utils.elements.js";

export default class ListenerSongManager {
    public currentSong: Song | null = null;

    constructor(private app: App, private listener: ListenerManager) {
        
    }

    public togglePlayState(): void {
        if (Elements.songControls.buttons.togglePlayButton == null) {
            return this.app.throwError("Can't toggle play button: Toggle play button element is null.");
        }

        Elements.songControls.buttons.togglePlayButton.setAttribute("playing", String(!this.listener.getPlayState()));
    }
};
