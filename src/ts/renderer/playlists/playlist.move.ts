import App from "./../app.js";
import PlaylistManager from "./playlists.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistsMoveManager {
    private originalPlaylistElementBuffer: HTMLElement | null = null;
    private movingPlaylistElementBuffer: HTMLElement | null = null;
    private clickOffset: Position = { x: 0, y: 0 };

    private canMove: boolean = false;
    private canTryMoving: boolean = true;
    
    constructor(private app: App, private playlists: PlaylistManager) {
        // this.initEvents();
    }

    private initEvents(): void {
        const container: HTMLElement = (Elements.playlists.container as HTMLElement);
        container.addEventListener("mousedown", (e: MouseEvent) => this.onMouseDown(e));
        window.addEventListener("mouseup", (e: MouseEvent) => this.onMouseUp(e));
        window.addEventListener("mousemove", (e: MouseEvent) => this.onMouseMove(e));
    }

    // MOUSE EVENTS
    private onMouseDown(e: MouseEvent): void {
        if (!this.canTryMoving) {
            return;
        }

        const element: HTMLElement = (e.target as HTMLElement);
        if (!element.hasAttribute("playlist-id")) {
            return;
        }

        const playlistIdStr: string = element.getAttribute("playlist-id")!;
        const playlistElement: HTMLElement | null = document.querySelector(`.playlist-container[playlist-id="${playlistIdStr}"]`);
        if (playlistElement == null) {
            return;
        }

        this.canTryMoving = false;
        this.originalPlaylistElementBuffer = playlistElement;

        setTimeout(() => {
            if (this.originalPlaylistElementBuffer != null) {
                this.originalPlaylistElementBuffer.classList.add("pre-move");
            }
        }, 100);

        setTimeout(() => {
            if (this.originalPlaylistElementBuffer != null) {
                this.onCanMove(e);
            }

            this.canTryMoving = true;
        }, 300);
    }

    private onMouseUp(e: MouseEvent): void {
        if (this.originalPlaylistElementBuffer != null) {
            this.originalPlaylistElementBuffer.classList.remove("locked");
            this.originalPlaylistElementBuffer.classList.remove("pre-move");
        }
        if (this.movingPlaylistElementBuffer != null) {
            this.movingPlaylistElementBuffer.remove();
        }

        this.originalPlaylistElementBuffer = null;
        this.movingPlaylistElementBuffer = null;
        this.clickOffset = { x: 0, y: 0 };
        this.canMove = false;
        this.canTryMoving = true;
    }

    private onMouseMove(e: MouseEvent): void {
        if (!this.canMove || this.movingPlaylistElementBuffer == null) {
            return;
        }

        const pos: Position = { x: e.x - this.clickOffset.x, y: e.y - this.clickOffset.y };
        this.movingPlaylistElementBuffer.style.left = `${pos.x}px`;
        this.movingPlaylistElementBuffer.style.top = `${pos.y}px`;

        if (pos.x > 333) {
            return;
        }

        let smallerDiff: number = 1000000;
        const nearestLi: Element | null = [...Elements.playlists.container!.children].reduce((acc: Element | null, li: Element) => {
            li.classList.remove("insert-after");
            li.classList.remove("insert-before");

            if (li.classList.contains("moving")) {
                return acc;
            }

            const liRect: DOMRect = li.getBoundingClientRect();
            const diff: number = Math.abs(liRect.y - pos.y);

            if (diff < smallerDiff) {
                smallerDiff = diff;
                acc = li;
            }

            return acc;
        }, null);

        
        if (nearestLi == null) {
            return;
        }

        const nearestLiRect: DOMRect = nearestLi.getBoundingClientRect();
        (nearestLiRect.y < pos.y) ? nearestLi.classList.add("insert-after") : nearestLi.classList.add("insert-before");
    }

    // VISUAL EVENTS
    private onCanMove(e: MouseEvent): void {
        if (this.originalPlaylistElementBuffer == null) {
            return;
        }

        this.canMove = true;
        this.originalPlaylistElementBuffer.classList.remove("pre-move");

        this.movingPlaylistElementBuffer = (this.originalPlaylistElementBuffer.cloneNode(true) as HTMLElement);

        this.originalPlaylistElementBuffer.classList.add("locked");
        this.clickOffset = { x: e.layerX, y: e.layerY };

        const width: number = this.originalPlaylistElementBuffer.getBoundingClientRect().width;

        this.movingPlaylistElementBuffer.classList.add("moving");
        this.movingPlaylistElementBuffer.style.width = `${width}px`;
        Elements.playlists.container!.appendChild(this.movingPlaylistElementBuffer);

        this.onMouseMove(e);
    }
};
