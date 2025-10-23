import PlaylistManager from "./playlists.js";
import App from "./../app.js";
import CenterModal from "../modals/modal.center.js";
import ModalTop from "../modals/modal.top.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistsCurrentManager {
    // INIT
    constructor(private app: App, private playlists: PlaylistManager) {
        this.initEvents();
    }

    private initEvents(): void {
        if (Elements.currentPlaylist.addSongsButton == null) {
            return this.app.throwError("Can't init current playlist events: Add song button element is null.");
        }

        Elements.currentPlaylist.addSongsButton.addEventListener("click", async () => await this.openAddSongToPlaylistModal());
    }

    // EVENTS
    private async openAddSongToPlaylistModal(): Promise<void> {
        const currentPlaylist: Playlist | null = this.app.playlistManager.getCurrentOpenedPlaylist();
        if (currentPlaylist == null) {
            return this.app.throwError("Can't open add song to playlist modal: Current playlist is null.");
        }

        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return this.app.throwError("Can't open add song to playlist modal: User is not logged in.");
        }

        const getAllSongsFromUserReqRes: any = await Requests.song.getAllFromUser(userData.id, userData.token);
        if (!getAllSongsFromUserReqRes.success) {
            return this.app.throwError(`Can't get songs from user: ${getAllSongsFromUserReqRes.error}`);
        }

        const getSongsFromPlaylistReqRes: any = await Requests.song.getFromPlaylist(userData.id, userData.token, currentPlaylist.id);
        if (!getSongsFromPlaylistReqRes.success) {
            return this.app.throwError(`Can't get songs from playlist: ${getSongsFromPlaylistReqRes.error}`);
        }

        const songTitlesFromPlaylist: string[] = (getSongsFromPlaylistReqRes.songs as Song[]).map((song: Song) => song.title);

        const songsLeft: Song[] = (getAllSongsFromUserReqRes.songs as Song[]).filter((song: Song) => {
            return !songTitlesFromPlaylist.includes(song.title);
        });
        const songTitlesToAdd: string[] = songsLeft.map((song: Song) => song.title);

        const content: ModalRow[] = [
            { label: "Title", type: "SELECT", data: songTitlesToAdd },
        ];

        const data: CenterModalData = {
            title: `Add song to ${currentPlaylist.name}`,
            content: content,
            onConfirm: async (res: ModalRes) => await this.addSongToPlaylistOnConfirm(res, songsLeft),
            cantClose: false,
        };
        
        new CenterModal(this.app, data);
    }

    private async addSongToPlaylistOnConfirm(res: ModalRes, songs: Song[]): Promise<ModalError> {
        const currentPlaylist: Playlist | null = this.app.playlistManager.getCurrentOpenedPlaylist();
        if (currentPlaylist == null) {
            return {
                error: "Current playlist is null.",
            };
        }

        const songIndex: number | undefined = res.rows["Title"].index;
        if (songIndex == undefined) {
            return {
                fieldName: "Title",
                error: "Song is not valid.",
            };
        }

        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return {
                error: "User is not logged in.",
            };
        }

        const song: Song = songs[songIndex];

        const addSongToPlaylistReqRes: any = await Requests.song.addToPlaylist(userData.id, userData.token, song.id, currentPlaylist.id);
        if (!addSongToPlaylistReqRes.success) {
            this.app.throwError(`Can't add song to playlist: ${addSongToPlaylistReqRes.error}`);
            return null;
        }

        await this.app.playlistManager.refresh();
        ModalTop.create("SUCCESS", `Successfully added song "${song.title}" by "${song.artist}" to playlist "${currentPlaylist.name}".`);
        return null;
    }
};
