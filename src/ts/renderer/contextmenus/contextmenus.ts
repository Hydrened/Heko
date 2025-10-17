import App from "../app.js";
import * as ContextmenuRows from "./contextmenu.rows.js";

export default class ContextmenuManager {
    private currentContextmenuElement: HTMLElement | null = null;

    constructor(private app: App) {
        this.initEvents();
    }

    private initEvents(): void {
        window.addEventListener("keydown", (e) => {
            if (e.key == "Escape") {
                this.closeContextMenu();
            }
        });

        window.addEventListener("click", (e) => {
            if (this.currentContextmenuElement == null) {
                return;
            }

            if (!this.currentContextmenuElement.contains((e.target as HTMLElement))) {
                this.closeContextMenu();
            }
        });
    }

    private createContextMenu(e: PointerEvent, rows: ContextmenuRow[]): void {
        this.closeContextMenu();
        
        this.currentContextmenuElement = document.createElement("ul");
        this.currentContextmenuElement.classList.add("contextmenu");
        this.currentContextmenuElement.style.top = `${e.y}px`;
        this.currentContextmenuElement.style.left = `${e.x}px`;
        document.body.appendChild(this.currentContextmenuElement);

        rows.forEach((row: ContextmenuRow) => this.createContextMenuRow(this.currentContextmenuElement, row));
    }

    private createContextMenuRow(parent: HTMLElement | null, row: ContextmenuRow): void {
        if (parent == null) {
            return this.app.throwError("Can't create contextmenu row: Row parent is null.");
        }

        const rowContainer: HTMLElement = document.createElement("li");
        parent.appendChild(rowContainer);

        const titleElement: HTMLElement = document.createElement("span");
        titleElement.classList.add("row-title");
        titleElement.textContent = row.title;
        rowContainer.appendChild(titleElement);
        
        if (row.shortcut != null) {

        }
    }

    private closeContextMenu(): void {
        if (this.currentContextmenuElement != null) {
            this.currentContextmenuElement.remove();
            this.currentContextmenuElement = null;
        }
    }

    public createPlaylistContextMenu(e: PointerEvent, playlist: Playlist): void {
        this.createContextMenu(e, ContextmenuRows.getPlaylistRows(playlist));
    }
};
