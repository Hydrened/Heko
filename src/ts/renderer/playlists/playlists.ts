import App from "../app.js";
import PlaylistsEventManager from "./playlist.events.js";
import PlaylistsRefreshContainerManager from "./playlist.refresh.container.js";
import PlaylistsRefreshOpenedManager from "./playlist.refresh.opened.js";
import PlaylistsOpenManager from "./playlists.open.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistManager {
    private playlistEventManager: PlaylistsEventManager;
    private refreshContainerManager: PlaylistsRefreshContainerManager;
    private refreshOpenedManager: PlaylistsRefreshOpenedManager;
    private openManager: PlaylistsOpenManager;

    private currentOpenedPlaylist: Playlist | null = null;
    private currentOpenedPlaylistSongs: Song[] = [];

    // INIT
    constructor(private app: App) {
        this.playlistEventManager = new PlaylistsEventManager(this.app, this);
        this.refreshContainerManager = new PlaylistsRefreshContainerManager(this.app, this);
        this.refreshOpenedManager = new PlaylistsRefreshOpenedManager(this.app, this);
        this.openManager = new PlaylistsOpenManager(this.app, this);
    }

    // EVENTS
    public async refreshPlaylistsContainerTab(): Promise<void> {
        await this.refreshContainerManager.refresh();
    }

    public async refreshOpenedPlaylistTab(): Promise<void> {
        await this.refreshOpenedManager.refresh();
    }

    public async open(playlistID: ID): Promise<void> {
        await this.openManager.open(playlistID);
        this.app.listenerManager.refresh();
    }

    public close(): void {
        this.openManager.close();
    }

    // GETTERS
    public getCurrentOpenedPlaylist(): Playlist | null {
        return this.currentOpenedPlaylist;
    }

    public getCurrentOpenedPlaylistSongs(): Song[] {
        return this.currentOpenedPlaylistSongs;
    }

    public getPlaylistOpenedStates(): number[] {
        const res: number[] = [];

        [...Elements.playlists.container!.querySelectorAll("li")].forEach((li: Element) => {
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

    public async getSortedPlaylists(): Promise<Playlist[]> {
        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return [];
        }

        const getAllPlaylistsFromUserReqRes: any = await Requests.playlist.getAllFromUser(userData.id, userData.token);
        if (!getAllPlaylistsFromUserReqRes.success) {
            this.app.throwError(`Can't get playlists from user: ${getAllPlaylistsFromUserReqRes.error}`);
            return [];
        }

        const playlists: Playlist[] = (getAllPlaylistsFromUserReqRes.playlists as Playlist[]);

        const playlistsByParent: Map<number, Playlist[]> = new Map<number, Playlist[]>();

        for (const playlist of playlists) {
            if (!playlistsByParent.has(playlist.parentID)) {
                playlistsByParent.set(playlist.parentID, []);
            }

            playlistsByParent.get(playlist.parentID)!.push(playlist);
        }

        const res: Playlist[] = [];

        const addWithChildren = (parentID: number): void => {
            const playlistGroup: Playlist[] | undefined = playlistsByParent.get(parentID);
            if (playlistGroup == undefined) {
                return;
            }

            playlistGroup.sort((a, b) => a.position - b.position);

            for (const playlist of playlistGroup) {
                res.push(playlist);
                addWithChildren(playlist.id);
            }
        };

        addWithChildren(-1);

        return res;
    }

    // SETTERS
    public setCurrentOpenedPlaylist(playlist: Playlist): void {
        this.currentOpenedPlaylist = structuredClone(playlist);
    }

    public setCurrentOpenedPlaylistSongs(songs: Song[]): void {
        this.currentOpenedPlaylistSongs = structuredClone(songs);
    }
};
