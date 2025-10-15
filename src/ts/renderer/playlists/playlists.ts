import App from "../app.js";
import PlaylistsRefreshManager from "./playlists.refresh.js";
import PlaylistsAddManager from "./playlists.add.js";
import PlaylistsRenameManager from "./playlists.rename.js";
import PlaylistsRemoveManager from "./playlists.remove.js";
import PlaylistsMoveManager from "./playlists.move.js";

export default class PlaylistsManager {
    private playlistsRefreshManager: PlaylistsRefreshManager;
    private playlistsAddManager: PlaylistsAddManager;
    private playlistsRenameManager: PlaylistsRenameManager;
    private playlistsRemoveManager: PlaylistsRemoveManager;
    private playlistsMoveManager: PlaylistsMoveManager;
    
    constructor(private app: App) {
        this.playlistsRefreshManager = new PlaylistsRefreshManager(this.app, this);
        this.playlistsAddManager = new PlaylistsAddManager(this.app, this);
        this.playlistsRenameManager = new PlaylistsRenameManager(this.app, this);
        this.playlistsRemoveManager = new PlaylistsRemoveManager(this.app, this);
        this.playlistsMoveManager = new PlaylistsMoveManager(this.app, this);
    }

    public async refresh(): Promise<void> {
        await this.playlistsRefreshManager.refresh();
    }
};
