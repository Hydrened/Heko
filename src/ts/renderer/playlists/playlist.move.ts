import App from "./../app.js";
import PlaylistManager from "./playlists.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistsMoveManager {
    private originalPlaylistElementBuffer: HTMLElement | null = null;
    private movingPlaylistElementBuffer: HTMLElement | null = null;
    private clickOffset: Position = { x: 0, y: 0 };
    private sameParentPlaylistElements: Element[] = [];

    private canMove: boolean = false;
    private canTryMoving: boolean = true;
    
    constructor(private app: App, private playlists: PlaylistManager) {
        this.initEvents();
    }

    private initEvents(): void {
        const container: HTMLElement = (Elements.playlists.container as HTMLElement);
        container.addEventListener("mousedown", (e: MouseEvent) => this.onMouseDown(e));
        window.addEventListener("mouseup", (e: MouseEvent) => this.onMouseUp(e));
        window.addEventListener("mousemove", (e: MouseEvent) => this.onMouseMove(e));
    }

    private reset(): void {
        if (this.originalPlaylistElementBuffer != null) {
            this.originalPlaylistElementBuffer.classList.remove("locked");
            this.originalPlaylistElementBuffer.classList.remove("pre-move");
        }
        if (this.movingPlaylistElementBuffer != null) {
            this.movingPlaylistElementBuffer.remove();
        }

        this.sameParentPlaylistElements.forEach((element: Element) => {
            element.classList.remove("insert-before");
            element.classList.remove("insert-after");
        });

        this.originalPlaylistElementBuffer = null;
        this.movingPlaylistElementBuffer = null;
        this.clickOffset = { x: 0, y: 0 };
        this.sameParentPlaylistElements = [];

        this.canMove = false;
        this.canTryMoving = true;
    }

    private onMouseDown(e: MouseEvent): void {
        if (!this.canTryMoving) {
            return;
        }

        const element: HTMLElement = (e.target as HTMLElement);
        if (!element.hasAttribute("playlist-id")) {
            return;
        }

        const playlistIdStr: string = element.getAttribute("playlist-id")!;
        const playlistElement: HTMLElement | null = PlaylistManager.getPlaylistElementFromID(Number(playlistIdStr));
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

        setTimeout(async () => {
            if (this.originalPlaylistElementBuffer != null) {
                await this.onCanMove(e, Number(playlistIdStr));
            }

            this.canTryMoving = true;
        }, 300);
    }

    private async onMouseUp(e: MouseEvent): Promise<void> {
        if (this.originalPlaylistElementBuffer == null) {
            return;
        }

        const insertBeforeElement: Element | null = document.querySelector(".playlist-container.insert-before");
        const insertAfterElement: Element | null = document.querySelector(".playlist-container.insert-after");

        if (insertBeforeElement == null && insertAfterElement == null) {
            return this.reset();
        }

        if (insertBeforeElement == this.originalPlaylistElementBuffer || insertAfterElement == this.originalPlaylistElementBuffer) {
            return this.reset();
        }

        let position: number = -1;

        if (insertBeforeElement != null) {
            const insertBeforePlaylist: Playlist | undefined = this.playlists.getPlaylistFromElement(insertBeforeElement);
            if (insertBeforePlaylist == undefined) {
                return this.reset();
            }

            position = (insertBeforePlaylist.position * 0.5);
        }
        else if (insertAfterElement != null) {
            const insertAfterElementIndex: number = this.sameParentPlaylistElements.indexOf(insertAfterElement);
            const insertAfterPlaylist: Playlist | undefined = this.playlists.getPlaylistFromElement(insertAfterElement);
            if (insertAfterPlaylist == undefined) {
                return this.reset();
            }

            const isInsertAfterElementLast: boolean = (insertAfterElementIndex == this.sameParentPlaylistElements.length - 1);
            if (isInsertAfterElementLast) {
                position = (insertAfterPlaylist.position * 2);
            }
            else {
                const nextPlaylistElement: Element = this.sameParentPlaylistElements[insertAfterElementIndex + 1];
                const nextPlaylist: Playlist | undefined = this.playlists.getPlaylistFromElement(nextPlaylistElement);
                if (nextPlaylist == undefined) {
                    return this.reset();
                }
                
                position = ((insertAfterPlaylist.position + nextPlaylist.position) * 0.5);
            }
        }

        const errorBase: string = "Can't update playlist position";

        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return this.app.throwError(`${errorBase}: User is not logged in.`);
        }

        const playlist: Playlist | undefined = this.playlists.getPlaylistFromElement(this.originalPlaylistElementBuffer);
        if (playlist == undefined) {
            return this.app.throwError(`${errorBase}: Playlist is undefined.`);
        }

        const updatePlaylistPositionReqRes: any = await Requests.playlist.updatePosition(userData.id, userData.token, playlist.id, position);
        if (!updatePlaylistPositionReqRes.success) {
            return this.app.throwError(`${errorBase}: ${updatePlaylistPositionReqRes.error}`);
        }

        this.playlists.refreshPlaylistBuffer().then(() => {
            this.playlists.refreshPlaylistsContainerTab();
        });

        this.reset();
    }

    private onMouseMove(e: MouseEvent): void {
        if (!this.canMove || this.movingPlaylistElementBuffer == null) {
            return;
        }

        const pos: Position = { x: e.x - this.clickOffset.x, y: e.y - this.clickOffset.y };
        this.movingPlaylistElementBuffer.style.left = `${pos.x}px`;
        this.movingPlaylistElementBuffer.style.top = `${pos.y}px`;

        if (pos.x > 400) {
            this.onMouseUp(e);
            return;
        }

        let smallerDiff: number = 1000000;
        const nearestLi: Element | null = this.sameParentPlaylistElements.reduce((acc: Element | null, li: Element) => {
            li.classList.remove("insert-before");
            li.classList.remove("insert-after");

            const liRect: DOMRect = li.getBoundingClientRect();
            const diff: number = Math.abs(liRect.y + liRect.height * 0.5 - pos.y);

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

    private async onCanMove(e: MouseEvent, playlistID: ID): Promise<void> {
        if (this.originalPlaylistElementBuffer == null) {
            return;
        }

        this.canMove = true;
        this.clickOffset = { x: e.layerX, y: e.layerY };

        this.originalPlaylistElementBuffer.classList.remove("pre-move");

        const width: number = this.originalPlaylistElementBuffer.getBoundingClientRect().width;

        this.movingPlaylistElementBuffer = (this.originalPlaylistElementBuffer.cloneNode(true) as HTMLElement);
        this.movingPlaylistElementBuffer.classList.add("moving");
        this.movingPlaylistElementBuffer.style.width = `${width}px`;
        Elements.playlists.container.appendChild(this.movingPlaylistElementBuffer);

        this.originalPlaylistElementBuffer.classList.add("locked");

        const parentPlaylistID: number = (this.app.playlistManager.getPlaylistFromID(playlistID)?.parentID ?? -1);
        const sameParentPlaylists: Playlist[] = this.app.playlistManager.getPlaylistBuffer().filter((playlist: Playlist) => playlist.parentID == parentPlaylistID);
        
        this.sameParentPlaylistElements = sameParentPlaylists.map((playlist: Playlist) => {
            return Elements.playlists.container.querySelector(`.playlist-container[playlist-id="${playlist.id}"]`);
        }).filter((element: Element | null) => element != null);

        this.sameParentPlaylistElements.sort((a: Element, b: Element) => {
            const rectA: DOMRect = a.getBoundingClientRect();
            const rectB: DOMRect = b.getBoundingClientRect();
            return (rectA.top - rectB.top);
        });

        this.onMouseMove(e);
    }
};
