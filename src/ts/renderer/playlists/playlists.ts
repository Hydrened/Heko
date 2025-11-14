import App from "./../app.js";
import PlaylistsEventManager from "./playlists.events.js";
import PlaylistsRefreshContainerManager from "./playlist.refresh.container.js";
import PlaylistsRefreshOpenedManager from "./playlist.refresh.opened.js";
import PlaylistsOpenManager from "./playlists.open.js";
import PlaylistsMoveManager from "./playlist.move.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistManager {
    private readonly playlistEventManager: PlaylistsEventManager;
    private readonly refreshContainerManager: PlaylistsRefreshContainerManager;
    private readonly refreshOpenedManager: PlaylistsRefreshOpenedManager;
    private readonly openManager: PlaylistsOpenManager;
    private readonly moveManager: PlaylistsMoveManager;

    private playlistBuffer: Playlist[] = [];
    private songBuffer: Song[] = [];

    private currentOpenedPlaylist: Playlist | null = null;

    // INIT
    constructor(private app: App) {
        this.playlistEventManager = new PlaylistsEventManager(this.app, this);
        this.refreshContainerManager = new PlaylistsRefreshContainerManager(this.app, this);
        this.refreshOpenedManager = new PlaylistsRefreshOpenedManager(this.app, this);
        this.openManager = new PlaylistsOpenManager(this.app, this);
        this.moveManager = new PlaylistsMoveManager(this.app, this);
    }

    // EVENTS
    public async loggedIn(): Promise<void> {
        await this.refreshPlaylistBuffer();
        await this.refreshSongBuffer();
        
        this.refreshPlaylistsContainerTab();
    }

    public refreshPlaylistsContainerTab(): void {
        this.refreshContainerManager.refresh();
    }

    public refreshOpenedPlaylistTab(): void {
        this.refreshOpenedManager.refresh();
    }

    public async refreshPlaylistBuffer(): Promise<void> {
        this.playlistBuffer = [];

        const getPlaylistsReqRes: any = await Requests.playlist.get(this.app);
        if (!getPlaylistsReqRes.success) {
            this.app.throwError(`Can't get playlists from user: ${getPlaylistsReqRes.error}`);
            return;
        }

        const rows: any[] = getPlaylistsReqRes.playlists;
        const playlistsMap: Map<number, Omit<Playlist, "children">> = new Map<number, Omit<Playlist, "children">>();

        for (const row of rows) {
            let playlist: Omit<Playlist, "children"> | undefined = playlistsMap.get(row.playlistID);

            if (playlist == undefined) {
                playlist = {
                    id: row.playlistID,
                    parentID: row.playlistParentID,
                    name: row.playlistName,
                    position: row.playlistPosition,
                    thumbnailFileName: row.playlistThumbnailFileName,
                    opened: row.playlistOpened,
                    mergedPlaylist: [],
                    songs: [],
                    creationDate: row.playlistCreationDate,
                };
                playlistsMap.set(row.playlistID, playlist);
            }

            if (row.mergedPlaylistID != null) {
                playlist.mergedPlaylist.push({
                    id: row.mergedPlaylistID,
                    toggled: row.mergedPlaylistToggled,
                });
            }

            if (row.songID != null) {
                playlist.songs.push({
                    id: row.songID,
                    fileName: row.songFileName,
                    title: row.songTitle,
                    artist: row.songArtist,
                    duration: row.songDuration,
                    creationDate: row.songCreationDate,
                });
            }
        }

        this.playlistBuffer = Array.from(playlistsMap.values()).map((p: Omit<Playlist, "children">) => ({
            ...p,
            children: Array.from(playlistsMap.values()).filter((c: Omit<Playlist, "children">) => c.parentID == p.id).length,
        }));

        if (this.currentOpenedPlaylist != null) {
            this.currentOpenedPlaylist = (this.getPlaylistFromID(this.currentOpenedPlaylist.id) ?? null);
        }
    }

    public async refreshSongBuffer(): Promise<void> {
        const getAllSongsFromUserReqRes: any = await Requests.song.get(this.app);
        if (!getAllSongsFromUserReqRes.success) {
            this.app.throwError(`Can't get songs from user: ${getAllSongsFromUserReqRes.error}`);
            this.songBuffer = [];
            return;
        }
        
        this.songBuffer = (getAllSongsFromUserReqRes.songs as Song[]);
    }

    public async open(playlistID: ID): Promise<void> {
        await this.openManager.open(playlistID);
        this.app.listenerManager.refresh();
    }

    public async close(): Promise<void> {
        await this.openManager.close();
    }

    // GETTERS

    // -- playlists
    public getCurrentOpenedPlaylist(): Playlist | null {
        return this.currentOpenedPlaylist;
    }

    public getSortedPlaylists(playlistFilter: Playlist[] = []): Playlist[] {
        const playlistIdFilter: ID[] = playlistFilter.map((p: Playlist) => p.id);
        const playlistsByParent: Map<number, Playlist[]> = new Map<number, Playlist[]>();

        for (const playlist of this.playlistBuffer) {
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

        if (playlistFilter.length == 0) {
            return res;
        }
        
        return res.filter((p: Playlist) => playlistIdFilter.includes(p.id));
    }

    public getPlaylistBuffer(): Playlist[] {
        return this.playlistBuffer;
    }

    public getPlaylistFromID(playlistID: ID): Playlist | undefined {
        return this.playlistBuffer.find((playlist: Playlist) => playlist.id == playlistID);
    }

    public getPlaylistWhereSongIsNotIn(songID: ID): Playlist[] {
        if (this.songBuffer.find((song: Song) => song.id == songID) == undefined) {
            this.app.throwError("Can't get playlist where song is not in: Song is undefined.");
            return [];
        }

        return this.playlistBuffer.filter((playlist: Playlist) => {
            const songIsNotIn: boolean = !playlist.songs.map((song: Song) => song.id).includes(songID);
            const playlistIsNotParent: boolean = (playlist.children == 0);
            
            return (songIsNotIn && playlistIsNotParent);
        });
    }

    public static getPlaylistElementFromID(playlistID: ID): HTMLElement | null {
        return document.querySelector(`.playlist-container[playlist-id="${playlistID}"]`);
    }

    // -- songs
    public getSongBuffer(): Song[] {
        return this.songBuffer;
    }

    public getSongFromID(songID: ID): Song | null {
        return (this.songBuffer.find((song: Song) => song.id == songID) ?? null);
    }

    public getSongsFromPlaylist(playlistID: ID): Song[] {
        const playlist: Playlist | undefined = this.getPlaylistFromID(playlistID);
        if (playlist == undefined) {
            this.app.throwError("Can't get songs from playlist: Playlist is undefined.");
            return [];
        }

        return playlist.songs;
    }

    public getPlaylistSongsLeft(): Song[] {
        const currentOpenedPlaylist: Playlist | null = this.app.playlistManager.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return [];
        }

        const songIDsFromPlaylist: ID[] = currentOpenedPlaylist.songs.map((song: Song) => song.id);
    
        return this.songBuffer.filter((song: Song) => {
            return !songIDsFromPlaylist.includes(song.id);
        });
    }

    public getMergedContainerSongs(mergedContainer: Playlist, toggledOnly: boolean): Song[] {
        return Object.values(mergedContainer.mergedPlaylist.map((mp: MergedPlaylist) => {
            if (toggledOnly && !mp.toggled) {
                return [];
            }

            const playlist: Playlist | undefined = this.app.playlistManager.getPlaylistFromID(mp.id);
            if (playlist == undefined) {
                this.app.throwError("Can't refresh current opened playlist details: A merged playlist is undefined.");
                return [];
            }

            return playlist.songs;

        }).flat().reduce((acc: { [id: ID]: Song }, song: Song) => {
            acc[song.id] = song;
            return acc;
        }, {}));
    }

    // -- other
    public getArtistNames(): string[] {
        const artists: string[] = this.songBuffer.map((song: Song) => song.artist);
        return [...new Set(["Unknown"].concat(artists))];
    }

    public getPlaylistOpenedStates(): number[] {
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

    public getPlaylistFromElement(playlistElement: Element): Playlist | undefined {
        if (!playlistElement.hasAttribute("playlist-id")) {
            return undefined;
        }

        const playlistID: number = Number(playlistElement.getAttribute("playlist-id"));
        if (isNaN(playlistID)) {
            return undefined;
        }

        return this.getPlaylistFromID(playlistID);
    }

    public static getPlaylistChildrenIDs(playlists: Playlist[], parentID: ID): ID[] {
        const children = playlists.filter((playlist: Playlist) => playlist.parentID == parentID);
        const res: ID[] = [];
    
        for (const child of children) {
            res.push(child.id);
            res.push(...this.getPlaylistChildrenIDs(playlists, child.id));
        }
    
        return res;
    }

    // SETTERS
    public setCurrentOpenedPlaylist(playlist: Playlist): void {
        this.currentOpenedPlaylist = structuredClone(playlist);
    }
};
