import PlaylistsManager from "./playlists.js";
import App from "../app.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistsRefreshManager {
    constructor(private app: App, private playlists: PlaylistsManager) {

    }

    public async refresh(): Promise<void> {
        if (Elements.playlists.container == null) {
            return;
        }

        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return this.app.logError("Can't refresh playlists: User is not logged in.");
        }

        const getPlaylistsReqRes: any = await Requests.playlist.get(userData.id, userData.token);
        const playlists: Playlist[] = getPlaylistsReqRes.playlists;
        
        console.log(playlists);
    }
};
