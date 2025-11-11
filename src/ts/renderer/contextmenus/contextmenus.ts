import App from "./../app.js";
import { getAccountRows } from "./contextmenu.rows/account.js";
import { getPlaylistContainerRows } from "./contextmenu.rows/playlist-container.js";
import { getPlaylistRows } from "./contextmenu.rows/playlist.js";
import { getSongSettingRows } from "./contextmenu.rows/song-settings.js";
import { getSongContainerRows } from "./contextmenu.rows/song-container.js";
import { getSongRows } from "./contextmenu.rows/song.js";
import { getMergedPlaylistRows } from "./contextmenu.rows/merged-playlist.js";
import { getMergedContainerRows } from "./contextmenu.rows/merged-container.js";
import * as Functions from "./../utils/utils.functions.js";

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
        if (rows.length == 0) {
            return;
        }

        this.closeContextMenu();
        
        this.currentContextmenuElement = document.createElement("ul");

        const windowWidth: number = window.innerWidth;
        const windowHeight: number = window.innerHeight;
        const height: number = this.getContextmenuHeight(rows.length);
        
        let x = position.x;
        let y = position.y;

        if (x + this.width > windowWidth) {
            x -= this.width;
        }
        if (y + height > windowHeight) {
            y -= height;
        }

        this.currentContextmenuElement.classList.add("contextmenu");
        this.currentContextmenuElement.style.top = `${y}px`;
        this.currentContextmenuElement.style.left = `${x}px`;
        document.body.appendChild(this.currentContextmenuElement);

        rows.forEach((row: ContextmenuRow, index: number) => this.createContextMenuRow(this.currentContextmenuElement, row, index));
    }

    private getContextmenuHeight(nbRows: number): number {
        return (this.padding * 2 + this.rowHeight * nbRows);
    }

    private createContextMenuRow(parent: HTMLElement | null, row: ContextmenuRow, level: number): void {
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
        titleElement.classList.add("extern-text");
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

            const windowWidth: number = window.innerWidth;
            const windowHeight: number = window.innerHeight;
            const parentRect: DOMRect = parent.getBoundingClientRect();
            const thisHeight: number = this.getContextmenuHeight(row.rows.length);

            if (parentRect.x + parentRect.width + this.width > windowWidth) {
                submenuElement.style.left = `calc(-${parentRect.width}px - var(--contextmenu-padding))`;
            }

            if (parentRect.y + this.getContextmenuHeight(level) + thisHeight > windowHeight) {
                submenuElement.style.top = `calc(-${thisHeight}px + var(--contextmenu-row-height) + 3px)`;
            }

            row.rows.forEach((r: ContextmenuRow, i: number) => this.createContextMenuRow(submenuElement, r, i));
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

    public createPlaylistContextMenu(position: Position, playlist: Playlist): void {
        const playlistElement: HTMLElement | null = document.querySelector(`li.playlist-wrapper[playlist-id="${String(playlist.id)}"]`);
        if (playlistElement == null) {
            return this.app.throwError("Can't create playlist contextmenu: Playlist element is null.");
        }

        this.setElementToContextmenuParent(playlistElement);
        this.createContextMenu(position, getPlaylistRows(this.app, playlist));
    }

    public createSongSettingContextMenu(position: Position): void {
        this.createContextMenu(position, getSongSettingRows(this.app));
    }

    public createSongContainerContextMenu(position: Position): void {
        this.createContextMenu(position, getSongContainerRows(this.app));
    }

    public createMergedContainerContextmenu(position: Position, mergeContainer: Playlist): void {
        this.createContextMenu(position, getMergedContainerRows(this.app, mergeContainer));
    }

    public createSongContextMenu(position: Position, song: Song, songElement: HTMLElement): void {
        this.setElementToContextmenuParent(songElement);
        this.createContextMenu(position, getSongRows(this.app, song));
    }

    public createMergedPlaylistContextMenu(position: Position, playlist: Playlist, playlistElement: HTMLElement): void {
        this.setElementToContextmenuParent(playlistElement);
        this.createContextMenu(position, getMergedPlaylistRows(this.app, playlist));
    }
};
