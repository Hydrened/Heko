import App from "./../app.js";
import ListenerManager from "./listener.js";
import * as Elements from "./../utils/utils.elements.js";

export default class ListenerRefreshManager {
    constructor(private app: App, private main: ListenerManager) {

    }

    public refresh(currentSong: Song | null): void {
        this.refreshDetails(currentSong);
        this.refreshSongClasses(currentSong);
    }

    private refreshDetails(currentSong: Song | null): void {
        Elements.currentSong.title.textContent = (currentSong?.title ?? "");
        Elements.currentSong.artist.textContent = (currentSong?.artist ?? "");
    }

    private refreshSongClasses(currentSong: Song | null): void {
        const currentListeningPlaylist: Playlist | null = this.main.getCurrentListeningPlaylist();
        if (currentListeningPlaylist == null || currentSong == null) {
            return;
        }

        [...Elements.currentPlaylist.song.container.querySelectorAll("li")].forEach((li: Element) => li.classList.remove("listening"));

        const currentSongLi: Element | undefined = [...Elements.currentPlaylist.song.container.querySelectorAll("li")].find((li: Element) => {
            const liPlaylistID: number = (li.hasAttribute("playlist-id") ? Number(li.getAttribute("playlist-id")) : -1);
            const liSongID: number = (li.hasAttribute("song-id") ? Number(li.getAttribute("song-id")) : -1);

            return (liPlaylistID == currentListeningPlaylist.id && liSongID == currentSong.id);
        });

        if (currentSongLi == undefined) {
            return;
        }

        currentSongLi.classList.add("listening");
    }
};
