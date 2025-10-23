import PlaylistManager from "./playlists.js";
import App from "./../app.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Elements from "./../utils/utils.elements.js";
import * as Functions from "./../utils/utils.functions.js";

export default class PlaylistsOpenManager {
    public currentPlaylist: Playlist | null = null;
    private currentSongs: Song[] = [];

    // INIT
    constructor(private app: App, private playlists: PlaylistManager) {

    }

    // OPEN CLOSE EVENTS
    public async open(playlistID: ID): Promise<void> {
        if (this.currentPlaylist != null) {
            this.close();
            await new Promise((r) => setTimeout(r, 500));
        }

        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return;
        }

        const getSongsFromPlaylistReqRes: any = await Requests.song.getFromPlaylist(userData.id, userData.token, playlistID);
        if (!getSongsFromPlaylistReqRes.success) {
            return this.app.throwError(`Can't get songs from playlist: ${getSongsFromPlaylistReqRes.error}`);
        }

        const getPlaylistReqRes: any = await Requests.playlist.get(userData.id, userData.token, playlistID);
        if (!getPlaylistReqRes.success) {
            return this.app.throwError(`Can't get playlist: ${getPlaylistReqRes.error}`);
        }

        this.currentPlaylist = (getPlaylistReqRes.playlist as Playlist);
        this.currentSongs = (getSongsFromPlaylistReqRes.songs as Song[]);
        await this.refresh();

        if (Elements.currentPlaylist.container == null) {
            return this.app.throwError("Can't open playlist: Current playlist container element is null.");
        }

        Elements.currentPlaylist.container.classList.add("opened");
    }

    public close(): void {
        if (Elements.currentPlaylist.container == null) {
            return this.app.throwError("Can't close playlist: Current playlist container element is null.");
        }

        Elements.currentPlaylist.container.classList.remove("opened");
    }

    // REFRESH EVENTS
    private async refresh(): Promise<void> {
        await this.refreshPlaylistDetails();
        this.refreshSongContainer();
    }

    private async refreshPlaylistDetails(): Promise<void> {
        if (this.currentPlaylist == null) {
            return;
        }

        if (Elements.currentPlaylist.details.thumbnail == null) {
            return this.app.throwError("Can't refresh playlist details: Playlist thumbnail element is null.");
        }

        const thumbnailElement: HTMLElement = (Elements.currentPlaylist.details.thumbnail as HTMLElement);
        const cssBackgroundImageProperty: string = `url("${Functions.getThumbnailPath(this.currentPlaylist.thumbnailFileName)}")`;
        thumbnailElement.style.backgroundImage = cssBackgroundImageProperty;

        if (Elements.currentPlaylist.details.title == null) {
            return this.app.throwError("Can't refresh playlist details: Playlist title element is null.");
        }

        Elements.currentPlaylist.details.title.textContent = this.currentPlaylist.name;

        if (Elements.currentPlaylist.details.songNumber == null) {
            return this.app.throwError("Can't refresh playlist details: Song number element is null.");
        }

        const nbSongs: number = this.currentPlaylist.songs;
        Elements.currentPlaylist.details.songNumber.textContent = `${nbSongs} ${Functions.pluralize("song", nbSongs)}`;

        if (Elements.currentPlaylist.details.duration == null) {
            return this.app.throwError("Can't refresh playlist details: Playlist duration element is null.");
        }

        const playlistDuration: number = this.currentSongs.reduce((acc: number, song: Song) => acc + song.duration, 0);
        const formatPlatlistDuration: string = Functions.formatDuration(playlistDuration);
        Elements.currentPlaylist.details.duration.textContent = formatPlatlistDuration;

        await this.playlists.refreshAddSongToPlaylistButton();
    }

    private refreshSongContainer(): void {
        Functions.removeChildren(Elements.currentPlaylist.songContainer);
        
        this.currentSongs.forEach((song: Song, index: number) => {
            if (Elements.currentPlaylist.songContainer == null) {
                return this.app.throwError("Can't refresh song container: Song container element is null.");
            }

            const liElement: HTMLElement = document.createElement("li");
            liElement.classList.add("current-playlist-table-row");
            Elements.currentPlaylist.songContainer.appendChild(liElement);

            liElement.addEventListener("contextmenu", (e: PointerEvent) => this.app.contextmenuManager.createSongContextMenu((e as Position), song));

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
