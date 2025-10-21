import App from "../app.js";
import getSongSettingRows from "./contextmenu.rows.song-settings.js";
import getSongRows from "./contextmenu.rows.song.js";
import * as Functions from "../utils/utils.functions.js";

export default class ContextmenuManager {
    private currentContextmenuElement: HTMLElement | null = null;
    private currentParentElement: HTMLElement | null = null;

    constructor(private app: App) {
        this.initEvents();
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

    private createContextMenu(position: Position, rows: ContextmenuRow[]): void {
        this.closeContextMenu();
        
        this.currentContextmenuElement = document.createElement("ul");
        this.currentContextmenuElement.classList.add("contextmenu");
        this.currentContextmenuElement.style.top = `${position.y}px`;
        this.currentContextmenuElement.style.left = `${position.x}px`;
        document.body.appendChild(this.currentContextmenuElement);

        rows.forEach((row: ContextmenuRow) => this.createContextMenuRow(this.currentContextmenuElement, row));
    }

    private createContextMenuRow(parent: HTMLElement | null, row: ContextmenuRow): void {
        if (parent == null) {
            return this.app.throwError("Can't create contextmenu row: Row parent is null.");
        }

        const rowContainer: HTMLElement = document.createElement("li");
        rowContainer.classList.add("contextmenu-row-container");
        parent.appendChild(rowContainer);

        if (row.disabled) {
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

    public async createPlaylistContextMenu(position: Position, playlist: Playlist): Promise<void> {
        const playlistElement: HTMLElement | null = document.querySelector(`li.playlist-wrapper[playlist-id="${String(playlist.id)}"]`);
        if (playlistElement == null) {
            return this.app.throwError("Can't create playlist contextmenu: Playlist element is null.");
        }

        // this.setElementToContextmenuParent(playlistElement);
        // this.createContextMenu(position, await getPlaylistRows(this.app, playlist));
    }

    public async createSongSettingContextMenu(position: Position): Promise<void> {
        this.createContextMenu(position, await getSongSettingRows(this.app));
    }

    public async createSongContextMenu(position: Position, song: Song): Promise<void> {
        this.createContextMenu(position, await getSongRows(this.app, song));
    }
};
