import Window from "./window.js";
import Api from "./utils/utils.api.js";
import AccountManager from "./account-manager/account-manager.js";
import PlaylistManager from "./playlist-manager/playlist-manager.js";
import SongManager from "./song-manager/song-manager.js";
import ArtistManager from "./artist-manager/artist-manager.js";
import CurrentPlaylistManager from "./current-playlist-manager/current-playlist-manager.js";
import * as Create from "./utils/utils.create.js";
import "./utils/utils.types.js";

export abstract class ElectronApp {
    public constructor() {
        new Window(this);
        this.initEvents();
    }

    private initEvents(): void {
        Api.Window.onStart(async (args: AppArgs) => await this.onStart(args));
        Api.Window.onClose(async () => await this.onClose());
        Api.Window.onClosed(async () => await this.onClosed());

        window.addEventListener("keydown", async (e: KeyboardEvent) => await this.onWindowKeydown(e));

        window.addEventListener("error", (e: ErrorEvent) => {
            e.preventDefault();
            console.error(e.error);
            Create.notification(e.error, "error");
        });

        window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
            e.preventDefault();
            console.error(e.reason);
            Create.notification(e.reason, "error");
        });
    }

    // EVENTS
    private async onWindowKeydown(e: KeyboardEvent): Promise<void> {
        if (!e.ctrlKey || e.key.toLowerCase() != "r") {
            return;
        }

        e.preventDefault();
        await this.onClose();
        window.location.reload();
    }

    protected abstract onStart(args: AppArgs): Promise<void>;

    protected abstract onClose(): Promise<void>;

    protected abstract onClosed(): Promise<void>;
};

export class App extends ElectronApp {
    public readonly accountManager: AccountManager = new AccountManager(this);
    public readonly playlistManager: PlaylistManager = new PlaylistManager(this);
    public readonly songManager: SongManager = new SongManager(this);
    public readonly artistManager: ArtistManager = new ArtistManager(this);
    public readonly currentPlaylistManager: CurrentPlaylistManager = new CurrentPlaylistManager(this);

    public constructor() {
        super();
    }

    protected override async onStart(args: AppArgs): Promise<void> {
        await this.accountManager.init();
        await this.playlistManager.open();
    }

    protected override async onClose(): Promise<void> {

    }

    protected override async onClosed(): Promise<void> {
        
    }
};
