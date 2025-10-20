import Window from "./window.js";
import Account from "./account.js";
import ContextmenuManager from "./contextmenus/contextmenus.js";
import PlaylistManager from "./playlists/playlists.js";
import ListenerManager from "./listener/listener.js";
import * as Bridge from "./utils/utils.bridge.js";
import "./utils/utils.types.js";

export default class App {
    private window: Window;
    public account: Account;
    public contextmenuManager: ContextmenuManager;
    public playlistManager: PlaylistManager;
    public listenerManager: ListenerManager;
    
    private threw: boolean = false;

    constructor() {
        this.window = new Window(this);
        this.account = new Account(this);
        this.contextmenuManager = new ContextmenuManager(this);
        this.playlistManager = new PlaylistManager(this);
        this.listenerManager = new ListenerManager(this);
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

    public logError(message: string): void {
        console.error(message);
    }
};
