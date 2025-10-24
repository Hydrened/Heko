import PlaylistManager from "./playlists.js";
import App from "./../app.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Elements from "./../utils/utils.elements.js";
import * as Functions from "./../utils/utils.functions.js";

export default class PlaylistsRefreshOpenedManager {
    constructor(private app: App, private playlists: PlaylistManager) {

    }

    public async refresh(): Promise<void> {
        await this.updateCurrentOpenedPlaylist();
        await this.updateCurrentOpenedPlaylistSongs();

        this.refreshDetails();
        await this.refreshAddSongButton();
        this.refreshPlaylistSongs();
    }

    private async updateCurrentOpenedPlaylist(): Promise<void> {
        const currentOpenedPlaylist: Playlist | null = this.playlists.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }

        const errorBase: string = "Can't update current opened playlist";

        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return this.app.throwError(`${errorBase}: User is  not logged in.`);
        }

        const getPlaylistReqRes: any = await Requests.playlist.get(userData.id, userData.token, currentOpenedPlaylist.id);
        if (!getPlaylistReqRes.success) {
            return this.app.throwError(`${errorBase}: ${getPlaylistReqRes.error}`);
        }

        this.playlists.setCurrentOpenedPlaylist((getPlaylistReqRes.playlist as Playlist));
    }

    private async updateCurrentOpenedPlaylistSongs(): Promise<void> {
        const currentOpenedPlaylist: Playlist | null = this.playlists.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }

        const errorBase: string = "Can't update current opened playlist songs";

        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return this.app.throwError(`${errorBase}: User is  not logged in.`);
        }

        const getSongsFromPlaylistReqRes: any = await Requests.song.getFromPlaylist(userData.id, userData.token, currentOpenedPlaylist.id);
        if (!getSongsFromPlaylistReqRes.success) {
            return this.app.throwError(`${errorBase}: ${getSongsFromPlaylistReqRes.error}`);
        }

        this.playlists.setCurrentOpenedPlaylistSongs((getSongsFromPlaylistReqRes.songs as Song[]));
    }

    private refreshDetails(): void {
        const thumbnailElement: HTMLElement = (Elements.currentPlaylist.details.thumbnail as HTMLElement);
        thumbnailElement.style.backgroundImage = "";
        Elements.currentPlaylist.details.title!.textContent = "";
        Elements.currentPlaylist.details.songNumber!.textContent = "";
        Elements.currentPlaylist.details.duration!.textContent = "";
        Elements.currentPlaylist.addSongsButton!.classList.add("disabled");

        const currentOpenedPlaylist: Playlist | null = this.playlists.getCurrentOpenedPlaylist();
        const currentOpenedPlaylistSongs: Song[] = this.playlists.getCurrentOpenedPlaylistSongs();
        if (currentOpenedPlaylist == null) {
            return;
        }

        const cssBackgroundImageProperty: string = `url("${Functions.getThumbnailPath(currentOpenedPlaylist.thumbnailFileName)}")`;
        thumbnailElement.style.backgroundImage = cssBackgroundImageProperty;

        Elements.currentPlaylist.details.title!.textContent = currentOpenedPlaylist.name;

        const nbSongs: number = currentOpenedPlaylist.songs;
        Elements.currentPlaylist.details.songNumber!.textContent = `${nbSongs} ${Functions.pluralize("song", nbSongs)}`;

        const playlistDuration: number = currentOpenedPlaylistSongs.reduce((acc: number, song: Song) => acc + song.duration, 0);
        const formatPlatlistDuration: string = Functions.formatDuration(playlistDuration);
        Elements.currentPlaylist.details.duration!.textContent = formatPlatlistDuration;
    }

    private async refreshAddSongButton(): Promise<void> {
        const currentOpenedPlaylist: Playlist | null = this.playlists.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }

        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return;
        }

        const getSongsFromPlaylistReqRes: any = await Requests.song.getFromPlaylist(userData.id, userData.token, currentOpenedPlaylist.id);
        if (!getSongsFromPlaylistReqRes.success) {
            return this.app.throwError(`Can't get songs from playlist: ${getSongsFromPlaylistReqRes.error}`);
        }

        const getAllSongsFromUserReqRes: any = await Requests.song.getAllFromUser(userData.id, userData.token);
        if (!getAllSongsFromUserReqRes.success) {
            return this.app.throwError(`Can't get songs from user: ${getAllSongsFromUserReqRes.error}`);
        }

        const playlistSongIDs: number[] = (getSongsFromPlaylistReqRes.songs as Song[]).map((song: Song) => song.id);
        const everyUserSongIDs: number[] = (getAllSongsFromUserReqRes.songs as Song[]).map((song: Song) => song.id);

        const canUserAddSongs: boolean = everyUserSongIDs.some((id: ID) => !playlistSongIDs.includes(id));
        if (canUserAddSongs) {
            Elements.currentPlaylist.addSongsButton!.classList.remove("disabled");
        }
    }

    private refreshPlaylistSongs(): void {
        Functions.removeChildren(Elements.currentPlaylist.songContainer);
        
        const currentOpenedPlaylistSongs: Song[] = this.playlists.getCurrentOpenedPlaylistSongs();
        currentOpenedPlaylistSongs.forEach((song: Song, index: number) => {
            const liElement: HTMLElement = document.createElement("li");
            liElement.classList.add("current-playlist-table-row");
            Elements.currentPlaylist.songContainer!.appendChild(liElement);

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
