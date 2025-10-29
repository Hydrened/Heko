import Window from "./window.js";
import Account from "./account.js";
import Settings from "./settings.js";
import ContextmenuManager from "./contextmenus/contextmenus.js";
import PlaylistManager from "./playlists/playlists.js";
import ListenerManager from "./listener/listener.js";
import * as Bridge from "./utils/utils.bridge.js";
import * as Requests from "./utils/utils.requests.js";
import "./utils/utils.types.js";

export default class App {
    private window: Window;
    public account: Account;
    public settings: Settings;

    public contextmenuManager: ContextmenuManager;
    public playlistManager: PlaylistManager;
    public listenerManager: ListenerManager;
    
    private threw: boolean = false;

    constructor() {
        this.window = new Window(this);
        this.account = new Account(this);
        this.settings = new Settings(this);

        this.contextmenuManager = new ContextmenuManager(this);
        this.playlistManager = new PlaylistManager(this);
        this.listenerManager = new ListenerManager(this);

        this.initEvents();
    }

    private initEvents(): void {
        Bridge.mainEvents.onClose(async () => await this.saveSettings());
    }

    private async saveSettings(): Promise<void> {
        const userData: UserData = this.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return;
        }

        const settings: UserSettings = {
            userID: userData.id,
            shuffle: this.listenerManager.getShuffleState(),
            loop: this.listenerManager.getLoopState(),
            speed: this.listenerManager.getSpeed(),
            volume: this.listenerManager.getVolume(),
        };

        const saveUserSettingsReqRes: any = await Requests.user.saveSettings(userData.id, userData.token, settings);
        if (!saveUserSettingsReqRes.success) {
            return this.throwError(`Can't save settings: ${saveUserSettingsReqRes.error}`);
        }
    }

    public async init(): Promise<void> {
        await this.account.init();
    }

    public throwError(message: string): void {
        if (!this.threw) {
            Bridge.throwError(message);
            this.threw = true;
        }
    }

    // LOGIN EVENTS
    public async loggedIn(): Promise<void> {
        this.listenerManager.loggedIn();
        await this.playlistManager.refreshPlaylistsContainerTab();
        await this.openFirstPlaylist();
    }

    public async openFirstPlaylist(): Promise<void> {
        const playlists: Playlist[] = await this.playlistManager.getSortedPlaylists();

        const firstSongPlaylist: Playlist | undefined = playlists[playlists.findIndex((playlist: Playlist) => playlist.children == 0)];
        if (firstSongPlaylist != undefined) {
            await this.playlistManager.open(firstSongPlaylist.id);
        }
    }

    public async loggedOut(): Promise<void> {
        await this.playlistManager.refreshPlaylistsContainerTab();
        this.playlistManager.close();
        this.listenerManager.loggedOut();
    } 
};
