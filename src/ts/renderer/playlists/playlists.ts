import App from "../app.js";
import PlaylistsRefreshManager from "./playlists.refresh.js";
import PlaylistsAddManager from "./playlists.add.js";
import PlaylistsMoveManager from "./playlists.move.js";
import PlaylistsOpenManager from "./playlists.open.js";
import PlaylistsSongsManager from "./playlists.songs.js";
import PlaylistsCurrentManager from "./playlists.current.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistManager {
    public refreshManager: PlaylistsRefreshManager;
    private addManager: PlaylistsAddManager;
    private moveManager: PlaylistsMoveManager;
    private openManager: PlaylistsOpenManager;
    private songsManager: PlaylistsSongsManager;
    private currentManager: PlaylistsCurrentManager;
    
    constructor(private app: App) {
        this.refreshManager = new PlaylistsRefreshManager(this.app, this);
        this.addManager = new PlaylistsAddManager(this.app, this);
        this.moveManager = new PlaylistsMoveManager(this.app, this);
        this.openManager = new PlaylistsOpenManager(this.app, this);
        this.songsManager = new PlaylistsSongsManager(this.app, this);
        this.currentManager = new PlaylistsCurrentManager(this.app, this);
    }

    public async refresh(): Promise<void> {
        await this.refreshManager.refresh();

        const currentPlaylist: Playlist | null = this.openManager.currentPlaylist;
        if (currentPlaylist != null) {
            await this.open(currentPlaylist.id);
        }
    }

    public async open(playlistID: ID): Promise<void> {
        await this.openManager.open(playlistID);
    }

    public getPlaylistOpenedStates(): number[] {
        if (Elements.playlists.container == null) {
            this.app.throwError("Can't get playlist opened states: Container is null.");
            return [];
        }

        const res: number[] = [];

        [...Elements.playlists.container.querySelectorAll("li")].forEach((li: Element) => {
            if (!li.hasAttribute("playlist-id")) {
                return;
            }

            const playlistID: number = Number(li.getAttribute("playlist-id"));
            if (isNaN(playlistID)) {
                return;
            }

            const opened: boolean = ([...li.children].find((e: Element) => e.classList.contains("opened")) != undefined);
            if (opened) {
                res.push(playlistID);
            }
        });
        
        return res;
    }

    public getCurrentOpenedPlaylist(): Playlist | null {
        return this.openManager.currentPlaylist;
    }

    public async getSortedPlaylists(): Promise<Playlist[]> {
        return await this.refreshManager.getSortedPlaylists();
    }
};
