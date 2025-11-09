import Window from "./window.js";
import Account from "./account.js";
import Settings from "./settings/settings.js";
import ModalManager from "./modals/modals.js";
import ContextmenuManager from "./contextmenus/contextmenus.js";
import PlaylistManager from "./playlists/playlists.js";
import ListenerManager from "./listener/listener.js";
import * as Bridge from "./utils/utils.bridge.js";
import * as Requests from "./utils/utils.requests.js";
import * as Elements from "./utils/utils.elements.js";
import "./utils/utils.types.js";

export default class App {
    private readonly window: Window;
    public readonly account: Account;
    public readonly settings: Settings;

    public readonly modalManager: ModalManager;
    public readonly contextmenuManager: ContextmenuManager;
    public readonly playlistManager: PlaylistManager;
    public readonly listenerManager: ListenerManager;
    
    private threw: boolean = false;
    private dev: boolean = false;

    constructor() {
        this.window = new Window(this);
        this.account = new Account(this);
        this.settings = new Settings(this);

        this.modalManager = new ModalManager(this);
        this.contextmenuManager = new ContextmenuManager(this);
        this.playlistManager = new PlaylistManager(this);
        this.listenerManager = new ListenerManager(this);

        this.initEvents();
    }

    private initEvents(): void {
        Bridge.mainEvents.onStart((data: any) => {
            this.dev = data.dev;
        });
        
        Bridge.mainEvents.onClose(async () => await this.saveSettings());
    }

    public async init(): Promise<void> {
        const getResponseResRes: any = await Requests.app.getResponse();
        if (!getResponseResRes.success) {
            return console.error("No internet connection.");
        }

        const response: number = (this.dev ? 200 : (getResponseResRes.response as number));
        switch (response) {
            case 200:
                await this.account.init();
                this.settings.open();
                break;

            case 503:
                Elements.maintenanceContainer.classList.remove("hidden");
                break;

            default: return;
        }
    }

    private async saveSettings(): Promise<void> {
        if (!this.account.isLoggedIn()) {
            return;
        }

        const settings: UserSettings = {
            shuffle: this.listenerManager.getShuffleState(),
            loop: this.listenerManager.getLoopState(),
            speed: this.listenerManager.getSpeed(),
            volume: this.listenerManager.getVolume(),
        };

        const saveUserSettingsReqRes: any = await Requests.user.saveSettings(this, settings);
        if (!saveUserSettingsReqRes.success) {
            return this.throwError(`Can't save settings: ${saveUserSettingsReqRes.error}`);
        }
    }

    public throwError(message: string): void {
        if (this.dev) {
            return console.error(message);
        }

        if (!this.threw) {
            Bridge.throwError(message);
            this.threw = true;
        }
    }

    // LOGIN EVENTS
    public async loggedIn(): Promise<void> {
        this.settings.loggedIn();
        this.listenerManager.loggedIn();
        await this.playlistManager.loggedIn();
        await this.openFirstPlaylist();
    }

    public async openFirstPlaylist(): Promise<void> {
        const playlists: Playlist[] = this.playlistManager.getSortedPlaylists();

        const firstSongPlaylist: Playlist | undefined = playlists[playlists.findIndex((playlist: Playlist) => playlist.children == 0)];
        if (firstSongPlaylist != undefined) {
            await this.playlistManager.open(firstSongPlaylist.id);
        }
    }

    public loggedOut(): void {
        this.playlistManager.refreshPlaylistsContainerTab();
        this.playlistManager.close();
        this.listenerManager.loggedOut();
    } 
};
