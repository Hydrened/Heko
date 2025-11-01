import App from "./../app.js";
import PlaylistManager from "./playlists.js";
import * as Functions from "./../utils/utils.functions.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistsRefreshOpenedManager {
    constructor(private app: App, private playlists: PlaylistManager) {

    }

    public refresh(): void {
        this.refreshDetails();
        this.refreshAddSongButton();
        this.refreshPlaylistSongs();
    }

    private refreshDetails(): void {
        const thumbnailElement: HTMLElement = (Elements.currentPlaylist.details.thumbnail as HTMLElement);
        thumbnailElement.style.backgroundImage = "";
        Elements.currentPlaylist.details.title.textContent = "";
        Elements.currentPlaylist.details.songNumber.textContent = "";
        Elements.currentPlaylist.details.duration.textContent = "";
        Elements.currentPlaylist.addSongsButton.classList.add("disabled");

        const currentOpenedPlaylist: Playlist | null = this.playlists.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }

        const currentOpenedPlaylistSongs: Song[] = currentOpenedPlaylist.songs;

        const cssBackgroundImageProperty: string = `url("${Functions.getThumbnailPath(currentOpenedPlaylist.thumbnailFileName)}")`;
        thumbnailElement.style.backgroundImage = cssBackgroundImageProperty;

        Elements.currentPlaylist.details.title.textContent = currentOpenedPlaylist.name;

        const nbSongs: number = currentOpenedPlaylist.songs.length;
        Elements.currentPlaylist.details.songNumber.textContent = `${nbSongs} ${Functions.pluralize("song", nbSongs)}`;

        const playlistDuration: number = currentOpenedPlaylistSongs.reduce((acc: number, song: Song) => acc + song.duration, 0);
        const formatPlatlistDuration: string = Functions.formatDuration(playlistDuration);
        Elements.currentPlaylist.details.duration.textContent = formatPlatlistDuration;

        (Elements.currentPlaylist.songFilterInput as HTMLInputElement).value = "";
    }

    private refreshAddSongButton(): void {
        const currentOpenedPlaylist: Playlist | null = this.playlists.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }

        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return;
        }

        const playlistSongIDs: number[] = currentOpenedPlaylist.songs.map((song: Song) => song.id);
        const everyUserSongIDs: number[] = (this.playlists.getSongBuffer()).map((song: Song) => song.id);

        const canUserAddSongs: boolean = everyUserSongIDs.some((id: ID) => !playlistSongIDs.includes(id));
        if (canUserAddSongs) {
            Elements.currentPlaylist.addSongsButton.classList.remove("disabled");
        }
    }

    private refreshPlaylistSongs(): void {
        Functions.removeChildren(Elements.currentPlaylist.songContainer);
        
        const currentOpenedPlaylist: Playlist | null = this.playlists.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }

        currentOpenedPlaylist.songs.forEach((song: Song, index: number) => {
            const liElement: HTMLElement = document.createElement("li");
            liElement.setAttribute("playlist-id", String(currentOpenedPlaylist.id));
            liElement.setAttribute("song-id", String(song.id));
            liElement.classList.add("current-playlist-table-row");
            Elements.currentPlaylist.songContainer.appendChild(liElement);

            liElement.addEventListener("click", () => {
                this.app.listenerManager.initQueue(currentOpenedPlaylist, song);
            });
            liElement.addEventListener("contextmenu", (e: PointerEvent) => this.app.contextmenuManager.createSongContextMenu((e as Position), song, liElement));

            const formatDuration: string = Functions.formatDuration(song.duration);

            const rowElementTexts: string[] = [String(index + 1), song.title, song.artist, formatDuration];
            rowElementTexts.forEach((text: string) => {
                const rowElement: HTMLElement = document.createElement("p");
                rowElement.textContent = text;
                liElement.appendChild(rowElement);
            });
        });
    }
};
