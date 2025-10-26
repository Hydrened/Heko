import { getAccountRows } from "./contextmenu.account.js";
import { getPlaylistContainerRows } from "./contextmenu.playlist-container.js";
import { getPlaylistRows } from "./contextmenu.playlist.js";
import { getSongSettingRows } from "./contextmenu.song-settings.js";
import { getSongContainerRows } from "./contextmenu.song-container.js";
import { getSongRows } from "./contextmenu.song.js";
import App from "../app.js";
import * as Functions from "../utils/utils.functions.js";

export default class ContextmenuManager {
    private currentContextmenuElement: HTMLElement | null = null;
    private currentParentElement: HTMLElement | null = null;

    private padding: number = 0;
    private width: number = 0;
    private rowHeight: number = 0;

    // INIT
    constructor(private app: App) {
        this.initEvents();
        this.loadCssVariables();
    }

    private initEvents(): void {
        window.addEventListener("keydown", (e) => {
            if (e.key == "Escape") {
                this.closeContextMenu();
            }
        });

        window.addEventListener("mousedown", (e) => {
            if (this.currentContextmenuElement == null) {
                return;
            }

            if (!this.currentContextmenuElement.contains((e.target as HTMLElement))) {
                this.closeContextMenu();
            }
        });
    }

    private loadCssVariables(): void {
        this.padding = Functions.getCssVariable("contextmenu-padding", "PIXEL");
        this.width = Functions.getCssVariable("contextmenu-width", "PIXEL");
        this.rowHeight = Functions.getCssVariable("contextmenu-row-height", "PIXEL");
    }

    // PRIVATE CREATE EVENTS
    private createContextMenu(position: Position, rows: ContextmenuRow[]): void {
        this.closeContextMenu();
        
        this.currentContextmenuElement = document.createElement("ul");

        const windowWidth: number = window.innerWidth;
        const windowHeight: number = window.innerHeight;
        const height: number = this.getContextmenuHeight(rows.length);
        
        if (position.x + this.width > windowWidth) {
            position.x -= this.width;
            this.currentContextmenuElement.classList.add("right");
        }
        if (position.y + height > windowHeight) {
            position.y -= height;
        }

        this.currentContextmenuElement.classList.add("contextmenu");
        this.currentContextmenuElement.style.top = `${position.y}px`;
        this.currentContextmenuElement.style.left = `${position.x}px`;
        document.body.appendChild(this.currentContextmenuElement);

        rows.forEach((row: ContextmenuRow) => this.createContextMenuRow(this.currentContextmenuElement, row));
    }

    private getContextmenuHeight(nbRows: number): number {
        return (this.padding * 2 + this.rowHeight * nbRows);
    }

    private createContextMenuRow(parent: HTMLElement | null, row: ContextmenuRow): void {
        if (parent == null) {
            return this.app.throwError("Can't create contextmenu row: Row parent is null.");
        }

        const rowContainer: HTMLElement = document.createElement("li");
        rowContainer.classList.add("contextmenu-row-container");
        parent.appendChild(rowContainer);

        const isRowUseless: boolean = (row.onClick == undefined && ((row.rows != undefined) ? (row.rows.length == 0) : true));
        if (row.disabled || isRowUseless) {
            rowContainer.classList.add("disabled");
        }

        rowContainer.addEventListener("click", () => {
            if (row.onClick != null) {
                row.onClick();
            } 
            
            this.closeContextMenu();
        });

        const titleElement: HTMLElement = document.createElement("span");
        titleElement.classList.add("contextmenu-row-title");
        titleElement.textContent = row.title;
        rowContainer.appendChild(titleElement);
        
        if (row.shortcut != null) {
            const shortcutElement: HTMLElement = document.createElement("span");
            shortcutElement.classList.add("contextmenu-row-shortcut");
            shortcutElement.textContent = Functions.shortcutToString(row.shortcut);
            rowContainer.appendChild(shortcutElement);
        
        } else if (row.rows != null) {

            if (row.rows.length == 0) {
                return;
            }

            const submenuIndicatorElement: HTMLImageElement = document.createElement("img");
            submenuIndicatorElement.classList.add("contextmenu-row-submenu-indicator");
            submenuIndicatorElement.src = "assets/indicator.svg";
            rowContainer.appendChild(submenuIndicatorElement);

            const submenuElement: HTMLElement = document.createElement("ul");
            submenuElement.classList.add("contextmenu-submenu-container");
            rowContainer.appendChild(submenuElement);

            row.rows.forEach((r: ContextmenuRow) => this.createContextMenuRow(submenuElement, r));
        }
    }

    private closeContextMenu(): void {
        if (this.currentContextmenuElement == null) {
            return;
        }

        if (this.currentParentElement != null) {
            this.currentParentElement.classList.remove("contextmenu-parent");
            this.currentParentElement = null;
        }

        this.currentContextmenuElement.remove();
        this.currentContextmenuElement = null;
    }

    private setElementToContextmenuParent(element: HTMLElement): void {
        this.currentParentElement = element;
        element.classList.add("contextmenu-parent");
    }

    // PUBLIC CREATE EVENTS
    public createAccountContextmenu(position: Position): void {
        this.createContextMenu(position, getAccountRows(this.app));
    }

    public createPlaylistContainerContextmenu(position: Position): void {
        this.createContextMenu(position, getPlaylistContainerRows(this.app));
    }

    public async createPlaylistContextMenu(position: Position, playlist: Playlist): Promise<void> {
        const playlistElement: HTMLElement | null = document.querySelector(`li.playlist-wrapper[playlist-id="${String(playlist.id)}"]`);
        if (playlistElement == null) {
            return this.app.throwError("Can't create playlist contextmenu: Playlist element is null.");
        }

        this.setElementToContextmenuParent(playlistElement);
        this.createContextMenu(position, await getPlaylistRows(this.app, playlist));
    }

    public async createSongSettingContextMenu(position: Position): Promise<void> {
        this.createContextMenu(position, await getSongSettingRows(this.app));
    }

    public async createSongContainerContextMenu(position: Position, openedPlaylist: Playlist): Promise<void> {
        this.createContextMenu(position, await getSongContainerRows(this.app, openedPlaylist));
    }

    public async createSongContextMenu(position: Position, song: Song, songElement: HTMLElement): Promise<void> {
        this.setElementToContextmenuParent(songElement);
        this.createContextMenu(position, await getSongRows(this.app, song));
    }
};
