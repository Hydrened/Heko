import App from "./../app.js";
import PlaylistManager from "./playlists.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Functions from "./../utils/utils.functions.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistsOpenManager {
    private closingDuration: number = 0;
    
    constructor(private app: App, private playlists: PlaylistManager) {
        this.loadCssVariables();
    }

    private loadCssVariables(): void {
        this.closingDuration = Number(Functions.getCssVariable("playlist-open-duration", "MS_DURATION"));
    }

    public async open(playlistID: ID): Promise<void> {
        if (this.playlists.getCurrentOpenedPlaylist() != null) {
            this.close();
            await new Promise((r) => setTimeout(r, this.closingDuration));
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

        this.playlists.setCurrentOpenedPlaylist((getPlaylistReqRes.playlist as Playlist));
        this.playlists.setCurrentOpenedPlaylistSongs((getSongsFromPlaylistReqRes.songs as Song[]));

        await this.playlists.refreshOpenedPlaylistTab();

        Elements.currentPlaylist.container!.classList.add("opened");
    }

    public close(): void {
        Elements.currentPlaylist.container!.classList.remove("opened");
    }
};
