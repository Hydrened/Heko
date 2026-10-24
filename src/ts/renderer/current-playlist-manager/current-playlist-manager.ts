import CurrentPlaylistEventsManager from "./current-playlist-manager.events.js";
import Api from "./../utils/utils.api.js";
import Elements from "./../utils/utils.elements.js";
import Functions from "./../utils/utils.functions.js";
import { App } from "./../app.js";

export default class CurrentPlaylistManager {
    private static readonly transitionDuration: number = Functions.Css.get("current-playlist-transition-duration", "ms-duration");
    private static readonly openedClassName: string = "opened";

    private readonly elements = Elements.currentPlaylist;
    private readonly eventsManager: CurrentPlaylistEventsManager;

    private _playlists: Playlist[] | null = null;
    private _songs: Song[] | null = null;

    private _currentPlaylist: Playlist | null = null;
    private _currentPlaylistId: ID | null = null;
    private _currentPlaylistType: PlaylistType | null = null;
    private _currentPlaylistMerged: Playlist[] | null = null;
    
    // INIT
    public constructor(private readonly app: App) {
        this.eventsManager = new CurrentPlaylistEventsManager(this.app, this);
    }

    // LOAD
    private load(): void {
        this.loadHeader();
        this.loadRows();

        this.elements.container.classList.add(CurrentPlaylistManager.openedClassName);
    }

    private loadHeader(): void {
        this.elements.container.classList.add(this.currentPlaylistType);

        Functions.Heko.setThumbnail(this.elements.details.thumbnail, this.currentPlaylist.thumbnailFileName);
        this.elements.details.title.textContent = this.currentPlaylist.name;
        this.elements.details.count.textContent = this.getHeaderCountText();
        this.elements.details.duration.textContent = this.getHeaderDurationText();
    }

    private loadRows(): void {
        (this.currentPlaylistType === "song-playlist") ? this.loadSongs() : this.loadMerged();
    }

    private loadSongs(): void {

    }

    private loadMerged(): void {
        const mergedPlaylists: Playlist[] = this.playlists.filter((p: Playlist) => this.currentPlaylist.mergedIds.includes(p.id));
        mergedPlaylists.forEach((p: Playlist, index: number) => this.createMerged(p, index));
    }

    // UNLOAD
    private unload(): void {
        this.unloadHeader();
        this.unloadFilter();
        this.unloadRows();

        this._playlists = null;
        this._songs = null;

        this._currentPlaylist = null;
        this._currentPlaylistId = null;
        this._currentPlaylistType = null;
        this._currentPlaylistMerged = null;

        this.eventsManager.unload();
    }

    private unloadHeader(): void {
        this.elements.container.classList.remove("song-playlist", "merged-playlist");

        Functions.Heko.unsetThumbnail(this.elements.details.thumbnail);
        this.elements.details.title.textContent = "";
        this.elements.details.count.textContent = "";
        this.elements.details.duration.textContent = "";
    }

    private unloadFilter(): void {
        this.elements.options.filterInput.value = "";
    }

    private unloadRows(): void {
        Functions.Elements.removeChildren(this.elements.table.rowsContainer);
    }

    // CREATE
    private static createTextRowElement(parentElement: HTMLLIElement, text: string): HTMLParagraphElement {
        const textElement: HTMLParagraphElement = document.createElement("p");
        textElement.textContent = text;
        parentElement.appendChild(textElement);
        return textElement;
    }

    private static createCheckboxRowElement(parentElement: HTMLLIElement, checked: boolean): HTMLInputElement {
        const checkboxContainerElement: HTMLElement = document.createElement("div");
        checkboxContainerElement.classList.add("checkbox-container");
        parentElement.appendChild(checkboxContainerElement);

        const checkboxElement: HTMLInputElement = document.createElement("input");
        checkboxElement.type = "checkbox";
        checkboxElement.checked = checked;
        checkboxContainerElement.appendChild(checkboxElement);
        return checkboxElement;
    }

    private static createThumbnailRowElement(parentElement: HTMLLIElement, thumbnailFileName?: string): HTMLElement {
        const thumbnailElement: HTMLElement = document.createElement("div");
        Functions.Heko.setThumbnail(thumbnailElement, thumbnailFileName);
        parentElement.appendChild(thumbnailElement);
        return thumbnailElement;
    }

    private createMerged(playlist: Playlist, index: number): void {
        const containerElement: HTMLLIElement = document.createElement("li");
        this.elements.table.rowsContainer.appendChild(containerElement);

        CurrentPlaylistManager.createTextRowElement(containerElement, String(index + 1));

        CurrentPlaylistManager.createCheckboxRowElement(containerElement, playlist.toggled);
        CurrentPlaylistManager.createThumbnailRowElement(containerElement, playlist.thumbnailFileName);

        CurrentPlaylistManager.createTextRowElement(containerElement, playlist.name);
        CurrentPlaylistManager.createTextRowElement(containerElement, String(playlist.songIds.length));
        CurrentPlaylistManager.createTextRowElement(containerElement, this.getMergedRowDurationText(playlist));

        containerElement.addEventListener("click", () => Functions.Elements.antiSpam<void>(containerElement, async () => {
            await this.eventsManager.onPlaylistRowClick(playlist);
        }));

        containerElement.addEventListener("contextmenu", (e: PointerEvent) => this.eventsManager.onPlaylistRowContextmenu(Functions.Geometry.getPosition(e), playlist));
    }

    // GETTERS
    private getPlaylistsFromMergePlaylist(playlist: Playlist): Playlist[] {
        return playlist.mergedIds.map<Playlist>((mergedPlaylistId: ID) => {
            const playlist: Playlist | null = this.playlists.find((s: Playlist) => s.id === mergedPlaylistId) ?? null;
            if (playlist === null) {
                throw new Error(`Could not get playlists from merge playlist: Playlist with id = "${mergedPlaylistId}" is null.`);
            }

            return playlist;
        });
    }

    private getSongsFromPlaylist(playlist: Playlist): Song[] {
        const type: PlaylistType = (playlist.mergedIds.length > 0) ? "merged-playlist" : "song-playlist";

        const songIds: ID[] = [... new Set((type === "merged-playlist")
            ? this.getPlaylistsFromMergePlaylist(playlist).reduce((acc: ID[], p: Playlist) => acc.concat(p.songIds), [])
            : playlist.songIds)];

        return songIds.map<Song>((songId: ID) => {
            const song: Song | null = this.songs.find((s: Song) => s.id === songId) ?? null;
            if (song === null) {
                throw new Error(`Could not get songs from playlist: Song with id = "${songId}" is null.`);
            }

            return song;
        });
    }

    private get playlists(): Playlist[] {
        if (this._playlists === null) {
            throw new Error(`Could not get playlists: Playlists are null.`);
        }

        return this._playlists;
    }

    private get songs(): Song[] {
        if (this._songs === null) {
            throw new Error(`Could not get songs: Songs are null.`);
        }

        return this._songs;
    }

    private get currentPlaylist(): Playlist {
        if (this._currentPlaylist === null) {
            throw new Error(`Could not get current playlist: Current playlist is null.`);
        }

        return this._currentPlaylist;
    }

    private get currentPlaylistType(): PlaylistType {
        if (this._currentPlaylistType === null) {
            throw new Error(`Could not get current playlist type: Current playlist type is null.`);
        }

        return this._currentPlaylistType;
    }

    private get currentPlaylistMerged(): Playlist[] {
        if (this._currentPlaylistMerged === null) {
            throw new Error(`Could not get current playlist merged: Current playlist merged are null.`);
        }

        return this._currentPlaylistMerged;
    }

    private getHeaderCountText(): string {
        const songCount: number = this.getSongsFromPlaylist(this.currentPlaylist).length;
        const songCountText = `${songCount} ${Functions.Strings.pluralize("song", "songs", songCount)}`;

        if (this.currentPlaylistType === "song-playlist") {
            return songCountText;
        }

        const mergedCount: number = this.currentPlaylistMerged.length;
        return `${mergedCount} ${Functions.Strings.pluralize("playlist", "playlists", mergedCount)} ー ${songCountText}`;
    }

    private getHeaderDurationText(): string {
        const duration: number = this.getSongsFromPlaylist(this.currentPlaylist).reduce((acc: number, song: Song) => acc + song.duration, 0);
        return (duration !== 0) ? Functions.Time.formatSeconds(duration, 0, true, true) : "";
    }

    private getMergedRowDurationText(playlist: Playlist): string {
        const totalDuration: number = this.getSongsFromPlaylist(playlist).reduce((acc: number, song: Song) => acc + song.duration, 0);
        return Functions.Time.formatSecondsToClock(totalDuration);
    }

    // PUBLIC
    public async open(id: ID): Promise<void> {
        const errorBase: string = "Could not open playlist";

        await this.close();
        this._currentPlaylistId = id;

        const getPlaylistsReqRes: GetUserPlaylistsApiResult = await Api.Playlists.getAll();
        if (!getPlaylistsReqRes.success) {
            throw new Error(`${errorBase}: ${getPlaylistsReqRes.error}`);
        }

        this._playlists = getPlaylistsReqRes.playlists;

        const playlist: Playlist | null = this.playlists.find((p: Playlist) => p.id === id) ?? null;
        if (playlist === null) {
            throw new Error(`${errorBase}: Playlist with id = "${id}" is null.`);
        }

        this._currentPlaylist = playlist;

        const isMergeContainer: boolean = (this.currentPlaylist.mergedIds.length > 0);
        this._currentPlaylistType = (isMergeContainer) ? "merged-playlist" : "song-playlist";

        this._currentPlaylistMerged = this.currentPlaylist.mergedIds.map<Playlist>((mergedId: ID) => {
            const mergedPlaylist: Playlist | null = this.playlists.find((p: Playlist) => p.id === mergedId) ?? null;
            if (mergedPlaylist === null) {
                throw new Error(`${errorBase}: Playlist with id = "${mergedId}" is null.`);
            }

            return mergedPlaylist;
        });

        const getSongsReqRes: GetUserSongsApiResult = await Api.Songs.getAll();
        if (!getSongsReqRes.success) {
            throw new Error(`${errorBase}: ${getSongsReqRes.error}`);
        }
        
        this._songs = getSongsReqRes.songs;

        this.load();

        this.eventsManager.onSort("id");
        this.eventsManager.onFilter();
    }

    public async close(): Promise<void> {
        const isOpened: boolean = this.elements.container.classList.contains(CurrentPlaylistManager.openedClassName);
        if (isOpened) {
            this.elements.container.classList.remove(CurrentPlaylistManager.openedClassName);
            await Functions.Time.sleep(CurrentPlaylistManager.transitionDuration);
        }

        this.unload();
    }

    public getCurrentId(): ID | null {
        return this._currentPlaylistId;
    }

    public getCurrentType(): PlaylistType {
        return this.currentPlaylistType;
    }
};
