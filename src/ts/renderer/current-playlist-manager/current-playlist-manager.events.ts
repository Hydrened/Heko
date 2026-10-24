import CurrentPlaylistManager from "./current-playlist-manager.js";
import Elements from "./../utils/utils.elements.js";
import Functions from "./../utils/utils.functions.js";
import { App } from "./../app.js";
import * as Create from "../utils/utils.create.js";

export default class CurrentPlaylistEventsManager {
    private readonly elements = Elements.currentPlaylist;

    private currentSortType: PlaylistSortType | null = null;
    private currentSortAsc: boolean = false;
    
    // INIT
    public constructor(private readonly app: App, private readonly main: CurrentPlaylistManager) {
        this.initEvents();
    }

    private initEvents(): void {
        this.elements.details.addButton.addEventListener("click", () => Functions.Elements.antiSpam<void>(this.elements.details.addButton, async () => {
            await this.onAddSongToPlaylistButtonClick();
        }));

        this.elements.options.playButton.addEventListener("click", () => this.onPlayPlaylistButtonClick());

        this.elements.options.filterInput.addEventListener("input", () => this.onFilter());

        this.elements.table.headerButtons.id.addEventListener("click", () => this.onSort("id"));
        this.elements.table.headerButtons.playlistName.addEventListener("click", () => this.onSort("playlist-name"));
        this.elements.table.headerButtons.playlistSongCount.addEventListener("click", () => this.onSort("playlist-song-count"));
        this.elements.table.headerButtons.songTitle.addEventListener("click", () => this.onSort("song-title"));
        this.elements.table.headerButtons.songArtist.addEventListener("click", () => this.onSort("song-artist"));
        this.elements.table.headerButtons.duration.addEventListener("click", () => this.onSort("duration"));
    }

    // EVENTS
    private async onAddSongToPlaylistButtonClick(): Promise<void> {

    }

    private onPlayPlaylistButtonClick(): void {

    }

    public onFilter(): void {
        const value: string = this.elements.options.filterInput.value;
    }

    public onSort(type: PlaylistSortType): void {
        if (this.currentSortType === null) {
            this.currentSortType = type;
            this.currentSortAsc = false;
        }
        else if (type === this.currentSortType) {
            this.currentSortAsc = !this.currentSortAsc;
        }
        else {
            this.currentSortType = type;
            this.currentSortAsc = false;
        }

        console.log(this.currentSortAsc, this.currentSortType);
    }

    public onSongRowClick(song: Song): void {

    }

    public async onPlaylistRowClick(playlist: Playlist): Promise<void> {
        await this.main.open(playlist.id);
    }

    public onSongRowContextmenu(position: Position, song: Song): void {

    }

    public onPlaylistRowContextmenu(position: Position, playlist: Playlist): void {
        const openRow: ContextmenuRow = {
            title: "Open",
            onClick: () => this.onPlaylistRowClick(playlist),
        };

        const editRow: ContextmenuRow = {
            title: "Edit",
            onClick: () => {}, // todo
        };

        const toggleRow: ContextmenuRow = {
            title: "Toggle",
            onClick: () => {},
        };

        const removeFromPlaylistRow: ContextmenuRow = {
            title: "Remove from playlist",
            onClick: () => {},
        };

        Create.ContextmenuManager.create([openRow, editRow, toggleRow, removeFromPlaylistRow], position);
    }

    // OTHER
    public unload(): void {
        this.currentSortType = null;
        this.currentSortAsc = false;
    }
};
