import Window from "./window.js";
import Account from "./account.js";
import SettingsManager from "./settings/settings.js";
import ModalManager from "./modals/modals.js";
import ContextmenuManager from "./contextmenus/contextmenus.js";
import PlaylistManager from "./playlists/playlists.js";
import ListenerManager from "./listener/listener.js";
import * as Bridge from "./utils/utils.bridge.js";
import * as Api from "./utils/utils.api.js";
import * as Functions from "./utils/utils.functions.js";
import * as Elements from "./utils/utils.elements.js";
import "./utils/utils.types.js";

export default class App {
    private readonly window: Window;
    public readonly account: Account;
    public readonly settings: SettingsManager;

    public readonly modalManager: ModalManager;
    public readonly contextmenuManager: ContextmenuManager;
    public readonly playlistManager: PlaylistManager;
    public readonly listenerManager: ListenerManager;
    
    private threw: boolean = false;
    private dev: boolean = false;

    constructor() {
        this.window = new Window(this);
        this.account = new Account(this);
        this.settings = new SettingsManager(this);

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
        
        Bridge.mainEvents.onClose(async () => await this.onClose());

        window.addEventListener("keydown", async (e: KeyboardEvent) => {
            if (!e.ctrlKey || e.key.toLowerCase() != "r") {
                return;
            }

            e.preventDefault();
            await this.onClose();
            window.location.reload();
        });
    }

    public async init(): Promise<void> {
        const getResponseResRes: any = await Api.app.getResponse();
        if (!getResponseResRes.success) {
            return console.error("No internet connection.");
        }

        const response: number = (this.dev ? 200 : (getResponseResRes.response as number));
        switch (response) {
            case 200:
                await this.account.init();
                break;

            case 503:
                Elements.maintenanceContainer.classList.remove("hidden");
                break;

            default: return;
        }

        Elements.loadingScreen.classList.add("closing");
        setTimeout(() => Elements.loadingScreen.classList.remove(), 250);
    }

    public throwError(message: string, code: number): void {
        message = `${message} - Error code: ${code}`;

        if (this.dev) {
            return console.error(message);
        }

        if (!this.threw) {
            this.threw = true;

            this.onClose().then(() => {
                Bridge.main.throwError(message);
            });
        }
    }

    private async onClose(): Promise<void> {
        await this.settings.save();
        await this.listenerManager.loggedOut();
    }

    // LOGIN EVENTS
    public async loggedIn(): Promise<void> {
        await this.settings.loggedIn();
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

    public async loggedOut(): Promise<void> {
        await this.settings.save();
        await this.listenerManager.loggedOut();
        this.playlistManager.close();
        Functions.removeChildren(Elements.playlists.container);
    }
};
