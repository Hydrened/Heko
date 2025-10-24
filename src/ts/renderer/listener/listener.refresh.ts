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
        Elements.currentSong.title!.textContent = currentSong.title;
        Elements.currentSong.artist!.textContent = currentSong.artist;
    }
};
