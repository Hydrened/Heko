import App from "./../app.js";
import PlaylistManager from "./playlists.js";
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
            await this.close();
        }

        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return;
        }

        const playlist: Playlist | undefined = this.playlists.getPlaylistFromID(playlistID);
        if (playlist == undefined) {
            return this.app.throwError("Can't get playlist: Playlist is undefined.");
        }

        this.playlists.setCurrentOpenedPlaylist(playlist);
        this.playlists.refreshOpenedPlaylistTab();

        Elements.currentPlaylist.container.classList.add("opened");
    }

    public async close(): Promise<void> {
        Elements.currentPlaylist.container.classList.remove("opened");
        await new Promise((r) => setTimeout(r, this.closingDuration));
    }
};
