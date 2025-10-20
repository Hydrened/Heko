import PlaylistManager from "./playlists.js";
import App from "../app.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Elements from "./../utils/utils.elements.js";
import * as Functions from "./../utils/utils.functions.js";

export default class PlaylistsOpenManager {
    public currentPlaylist: Playlist | null = null;
    private currentSongs: Song[] = [];

    constructor(private app: App, private playlists: PlaylistManager) {

    }

    public async open(playlistID: ID): Promise<void> {
        this.reset();

        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return;
        }

        const getSongsFromPlaylistReqRes: any = await Requests.song.getFromPlaylist(userData.id, userData.token, playlistID);
        if (!getSongsFromPlaylistReqRes.success) {
            return this.app.throwError(`Can't open playlist: ${getSongsFromPlaylistReqRes.error}`);
        }

        const getPlaylistReqRes: any = await Requests.playlist.get(userData.id, userData.token, playlistID);
        if (!getPlaylistReqRes.success) {
            return this.app.throwError(`Can't open playlist: ${getPlaylistReqRes.error}`);
        }

        this.currentPlaylist = (getPlaylistReqRes.playlist as Playlist);
        this.currentSongs = (getSongsFromPlaylistReqRes.songs as Song[]);
        this.refresh();
    }

    private reset() {
        this.currentPlaylist = null;
        this.currentSongs = [];
    }

    private refresh(): void {
        this.refreshPlaylistDetails();
        this.refreshSongContainer();
    }

    private refreshPlaylistDetails(): void {
        if (this.currentPlaylist == null) {
            return;
        }

        if (Elements.currentPlaylist.details.thumbnail == null) {
            this.reset();
            return this.app.throwError("Can't refresh playlist details: Playlist thumbnail element is null.");
        }

        const thumbnailElement: HTMLElement = (Elements.currentPlaylist.details.thumbnail as HTMLElement);
        const cssBackgroundImageProperty: string = `url("${Functions.getThumbnailPath(this.currentPlaylist.thumbnailFileName)}")`;
        thumbnailElement.style.backgroundImage = cssBackgroundImageProperty;

        if (Elements.currentPlaylist.details.title == null) {
            this.reset();
            return this.app.throwError("Can't refresh playlist details: Playlist title element is null.");
        }

        Elements.currentPlaylist.details.title.textContent = this.currentPlaylist.name;

        if (Elements.currentPlaylist.details.songNumber == null) {
            this.reset();
            return this.app.throwError("Can't refresh playlist details: Song number element is null.");
        }

        const nbSongs: number = this.currentPlaylist.songs;
        Elements.currentPlaylist.details.songNumber.textContent = `${nbSongs} ${Functions.pluralize("song", nbSongs)}`;

        if (Elements.currentPlaylist.details.duration == null) {
            this.reset();
            return this.app.throwError("Can't refresh playlist details: Playlist duration element is null.");
        }

        const playlistDuration: number = this.currentSongs.reduce((acc: number, song: Song) => acc + song.duration, 0);
        const formatPlatlistDuration: string = Functions.formatDuration(playlistDuration);
        Elements.currentPlaylist.details.duration.textContent = formatPlatlistDuration;
    }

    private refreshSongContainer(): void {
        Functions.removeChildren(Elements.currentPlaylist.songContainer);
        
        this.currentSongs.forEach((song: Song, index: number) => {
            if (Elements.currentPlaylist.songContainer == null) {
                this.reset();
                return this.app.throwError("Can't refresh song container: Song container element is null.");
            }

            const liElement: HTMLElement = document.createElement("li");
            liElement.classList.add("current-playlist-table-row");
            Elements.currentPlaylist.songContainer.appendChild(liElement);

            liElement.addEventListener("contextmenu", (e: PointerEvent) => this.app.contextmenuManager.createSongContextMenu({ x: e.x, y: e.y }, song));

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
