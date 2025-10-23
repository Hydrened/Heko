import ListenerManager from "./listener.js";
import App from "./../app.js";
import * as Elements from "./../utils/utils.elements.js";

export default class ListenerRefreshManager {
    // INIT
    constructor(private app: App, private listener: ListenerManager) {

    }

    // EVENTS
    public refresh(currentSong: Song): void {
        const errorBase: string = "Can't refresh current song details";

        if (Elements.currentSong.title == null) {
            return this.app.throwError(`${errorBase}: Title element is null.`);
        }

        if (Elements.currentSong.artist == null) {
            return this.app.throwError(`${errorBase}: Artist element is null.`);
        }

        Elements.currentSong.title.textContent = currentSong.title;
        Elements.currentSong.artist.textContent = currentSong.artist;
    }
};
