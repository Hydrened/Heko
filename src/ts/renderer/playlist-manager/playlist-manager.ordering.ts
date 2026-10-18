import PlaylistManager from "./playlist-manager.js";
import Functions from "./../utils/utils.functions.js";
import { App } from "./../app.js";

export default class PlaylistOrderingManager {
    private static readonly movingPlaylistClassName: string = "moving";
    private static readonly hoveredPlaylistTopIndicationClassName: string = "move-top-indication";
    private static readonly hoveredPlaylistBottomIndicationClassName: string = "move-bottom-indication";
    private static readonly hoveredClosedParentClassName: string = "move-hover-opening";
    private static readonly holdDuration: number = 750;

    private focusedPlaylist: FocusedPlaylist | null = null;
    private closedParentPlaylistHover: ClosedParentPlaylistHover | null = null;

    public constructor(private readonly app: App, private readonly main: PlaylistManager) {}  

    public onPlaylistContainerMouseDown(e: MouseEvent, playlist: PlaylistWithElements): void {
        const containerElement: HTMLElement | null = playlist.elements?.containerElement ?? null;
        if (containerElement === null) {
            return;
        }

        const mousePosition: Position = Functions.Geometry.getPosition(e);
        const rect: Rect = Functions.Geometry.getRect(containerElement.getBoundingClientRect());
        const offset: Position = { x: mousePosition.x - rect.x, y: mousePosition.y - rect.y - (mousePosition.y - rect.y) * 1 / 3 };

        const playlistContainerElement: HTMLElement = document.createElement("div");
        playlistContainerElement.classList.add("moving-playlist-container");
        document.body.appendChild(playlistContainerElement);

        const playlistThumbnailElement: HTMLElement = document.createElement("div");
        playlistThumbnailElement.classList.add("thumbnail");
        playlistContainerElement.appendChild(playlistThumbnailElement);

        Functions.Heko.setThumbnail(playlistThumbnailElement, playlist.thumbnailFileName);

        const playlistTitleElement: HTMLParagraphElement = document.createElement("h2");
        playlistTitleElement.textContent = playlist.name;
        playlistContainerElement.appendChild(playlistTitleElement);

        this.focusedPlaylist = {
            id: playlist.id,
            defaultElement: containerElement,
            movingElement: playlistContainerElement,
            rect: rect,
            offset: offset,
            startTime: performance.now(),
            startTimeout: setTimeout(() => {
                containerElement.classList.add(PlaylistOrderingManager.movingPlaylistClassName);
                this.refreshFocusedPlaylistRects();
                this.refreshFocusedPlaylistPosition(mousePosition);
            }, PlaylistOrderingManager.holdDuration),
        };
    }

    public onWindowMouseMove(e: MouseEvent): void {
        if (this.focusedPlaylist === null) {
            return;
        }

        const mousePosition: Position = Functions.Geometry.getPosition(e);

        this.refreshFocusedPlaylistPosition(mousePosition);
        this.cancelClosedParentHoverIfLeft(mousePosition);

        if (!this.isFocusedPlaylistHoldValid(mousePosition)) {
            this.cancelFocusedPlaylist();
            return;
        }

        this.startClosedParentHoverIfNeeded(mousePosition);
        this.setMoveIndications(mousePosition);
    }

    public async onWindowMouseUp(e: MouseEvent): Promise<void> {
        if (this.closedParentPlaylistHover !== null) {
            this.cancelClosedParentHover();
        }

        if (this.focusedPlaylist == null) {
            return;
        }

        const hasReleasedTooSoon: boolean = (performance.now() - this.focusedPlaylist.startTime) < PlaylistOrderingManager.holdDuration;
        if (hasReleasedTooSoon) {
            this.cancelFocusedPlaylist();
            return;
        }

        if (this.focusedPlaylist.playlistRects === undefined) {
            return;
        }

        const mousePosition: Position = Functions.Geometry.getPosition(e);
        this.removeMoveIndications();

        const hoveredPlaylist: PlaylistWithRect | null = this.getHoveredPlaylist(mousePosition);
        if (hoveredPlaylist === null) {
            return;
        }

        const visiblePlaylists: PlaylistWithRect[] = this.getVisiblePlaylists();

        const hoveredPlaylistIndex: number = visiblePlaylists.findIndex((p: PlaylistWithRect) => p.id === hoveredPlaylist.id);
        if (hoveredPlaylistIndex === -1) {
            throw new Error(`Could not update playlist position: Playlist with id = "${hoveredPlaylist.id}" is null.`);
        }
        
        // const hoveredOnTop: boolean = Functions.Geometry.getRectCenterY(hoveredPlaylist.rect) > mousePosition.y;
        // const isParentPlaylist: boolean = (hoveredPlaylist.childIds.length > 0);

        // const siblingPlaylistIndex: number = (isParentPlaylist && !hoveredOnTop) ? hoveredPlaylistIndex + 1 : (hoveredOnTop) ? hoveredPlaylistIndex - 1 : hoveredPlaylistIndex + 1;
        // const siblingPlaylist: PlaylistWithRect | null = visiblePlaylists.find((p: PlaylistWithRect, index: number) => index === siblingPlaylistIndex) ?? null;

        // const haveDifferentParent: boolean = (hoveredPlaylist.parentId !== siblingPlaylist?.parentId);
        // const parentId: ID = (haveDifferentParent ? ((isParentPlaylist) ? (siblingPlaylist?.parentId ?? -1) : hoveredPlaylist.parentId) : hoveredPlaylist.parentId);

        // const hoveredPosition: number = hoveredPlaylist.position;
        // const siblingPosition: number = (haveDifferentParent) ? (isParentPlaylist ? 0 : 2147483647) : siblingPlaylist?.position ?? (hoveredOnTop ? 0 : 2147483647);

        // const position: number = ((hoveredPosition + siblingPosition) * 0.5);
        // // console.log(position, parentId);

        // console.log(siblingPosition);
        



        this.cancelFocusedPlaylist();
        // await this.refresh();
    }

    // OTHER
    private static isStillInsideRect(mousePosition: Position, rect: Rect, startTime: number): boolean {
        const isOnSameRect: boolean = Functions.Geometry.isPointInRect(rect, mousePosition);
        const hasMovedTooSoon: boolean = ((performance.now() - startTime) < PlaylistOrderingManager.holdDuration);

        if (!isOnSameRect && hasMovedTooSoon) {
            return false;
        }

        return true;
    }

    private isFocusedPlaylistHoldValid(mousePosition: Position): boolean {
        if (this.focusedPlaylist === null) {
            return false;
        }

        const isStillInsideRect: boolean = !PlaylistOrderingManager.isStillInsideRect(mousePosition, this.focusedPlaylist.rect, this.focusedPlaylist.startTime);
        if (this.focusedPlaylist.startTimeout !== null && isStillInsideRect) {
            return false;
        }

        return true;
    }

    private cancelClosedParentHoverIfLeft(mousePosition: Position): void {
        if (this.closedParentPlaylistHover === null) {
            return;
        }

        const isStillInsideRect: boolean = PlaylistOrderingManager.isStillInsideRect(mousePosition, this.closedParentPlaylistHover.rect, this.closedParentPlaylistHover.startTime);
        if (!isStillInsideRect) {
            this.cancelClosedParentHover();
        }
    }

    private refreshFocusedPlaylistRects(): void {
        if (this.focusedPlaylist === null) {
            return;
        }

        this.focusedPlaylist.startTimeout = null;
        this.cancelClosedParentHover();

        this.focusedPlaylist.playlistRects = this.getVisiblePlaylists();
    }

    private refreshFocusedPlaylistPosition(mousePosition: Position): void {
        if (this.focusedPlaylist === null) {
            return;
        }

        if (this.focusedPlaylist.startTimeout !== null) {
            return;
        }

        const focusedPlaylistElementPosition: Position = {
            x: mousePosition.x - this.focusedPlaylist.offset.x,
            y: mousePosition.y - this.focusedPlaylist.offset.y,
        };

        this.focusedPlaylist.movingElement.style.left = `${focusedPlaylistElementPosition.x}px`;
        this.focusedPlaylist.movingElement.style.top = `${focusedPlaylistElementPosition.y}px`;
    }

    private startClosedParentHoverIfNeeded(mousePosition: Position): void {
        if (this.focusedPlaylist === null) {
            return;
        }

        const hoveredPlaylist: PlaylistWithRect | null = this.focusedPlaylist.playlistRects?.find((p: PlaylistWithRect) => Functions.Geometry.isPointInRect(p.rect, mousePosition)) ?? null;
        if (hoveredPlaylist === null) {
            return;
        }

        const isHoverPlaylistParentAndClosed: boolean = (hoveredPlaylist.childIds.length > 0 && !hoveredPlaylist.opened);
        const isFocusedPlaylist: boolean = (hoveredPlaylist.id === this.focusedPlaylist.id);
        if (!isHoverPlaylistParentAndClosed || isFocusedPlaylist) {
            return;
        }

        const isSameClosedParentPlaylistHover: boolean = this.closedParentPlaylistHover?.id === hoveredPlaylist.id;
        if (isSameClosedParentPlaylistHover) {
            return;
        }

        if (hoveredPlaylist.elements === undefined) {
            throw new Error(`Could not start closed parent hover: Playlist with id = "${hoveredPlaylist.id}" has no elements.`);
        }

        hoveredPlaylist.elements.containerElement.classList.add(PlaylistOrderingManager.hoveredClosedParentClassName);

        this.closedParentPlaylistHover = {
            id: hoveredPlaylist.id,
            element: hoveredPlaylist.elements.containerElement,
            rect: hoveredPlaylist.rect,
            startTime: performance.now(),
            startTimeout: setTimeout(() => {
                this.main.getEventManager().onPlaylistContainerClick(hoveredPlaylist);
                this.refreshFocusedPlaylistRects();
            }, PlaylistOrderingManager.holdDuration),
        };
    }

    private getVisiblePlaylists(): PlaylistWithRect[] {
        console.log(this.playlists);

        const playlistsById: Map<number, PlaylistWithElements> = new Map(this.playlists.map((p: PlaylistWithElements): [number, PlaylistWithElements] => [p.id, p]));

        return this.playlists.filter((playlist: PlaylistWithElements): boolean => {
            let current: PlaylistWithElements = playlist;

            while (current.parentId !== -1) {
                const parent: PlaylistWithElements | undefined = playlistsById.get(current.parentId);

                if (parent === undefined || !parent.opened) {
                    return false;
                }

                current = parent;
            }

            return true;
        }).map<PlaylistWithRect>((p: PlaylistWithElements) => {
            if (p.elements === undefined) {
                throw new Error(`Could not get playlists rectangles: Playlist with id = "${p.id}" has no elements.`);
            }

            return { ...p, rect: Functions.Geometry.getRect(p.elements.containerElement.getBoundingClientRect()) };
        }).sort((a: PlaylistWithRect, b: PlaylistWithRect) => a.rect.y - b.rect.y);
    }

    private getHoveredPlaylist(mousePosition: Position): PlaylistWithRect | null {
        if (this.focusedPlaylist === null) {
            return null;
        }

        return (this.focusedPlaylist.playlistRects ?? []).reduce((acc: PlaylistWithRect | null, p: PlaylistWithRect) => {
            if (acc === null) {
                return p;
            }

            const accDistance: number = Math.abs(Functions.Geometry.getRectCenterY(acc.rect) - mousePosition.y);
            const pDistance: number = Math.abs(Functions.Geometry.getRectCenterY(p.rect) - mousePosition.y);

            return (accDistance < pDistance) ? acc : p;
        }, null);
    }

    private setMoveIndications(mousePosition: Position): void {
        this.removeMoveIndications();

        const hoveredPlaylist: PlaylistWithRect | null = this.getHoveredPlaylist(mousePosition);
        if (hoveredPlaylist === null) {
            return;
        }

        const onTop: boolean = Functions.Geometry.getRectCenterY(hoveredPlaylist.rect) > mousePosition.y;

        if (hoveredPlaylist.elements === undefined) {
            throw new Error(`Could not set move indications: Hovered playlist with id = "${hoveredPlaylist.id}" has no elements.`);
        }
        
        const className: string = (onTop) ? PlaylistOrderingManager.hoveredPlaylistTopIndicationClassName : PlaylistOrderingManager.hoveredPlaylistBottomIndicationClassName;
        hoveredPlaylist.elements.containerElement.classList.add(className);
    }

    private removeMoveIndications(): void {
        this.playlists.forEach((p: PlaylistWithElements) => p.elements?.containerElement.classList.remove(PlaylistOrderingManager.hoveredPlaylistTopIndicationClassName, PlaylistOrderingManager.hoveredPlaylistBottomIndicationClassName));
    }

    private cancelFocusedPlaylist(): void {
        if (this.focusedPlaylist === null) {
            return;
        }

        if (this.focusedPlaylist.startTimeout !== null) {
            clearTimeout(this.focusedPlaylist.startTimeout);
        }

        this.focusedPlaylist.defaultElement.classList.remove(PlaylistOrderingManager.movingPlaylistClassName);
        this.focusedPlaylist.movingElement.remove();
        this.focusedPlaylist.startTimeout = null;
        this.focusedPlaylist = null;
    }

    private cancelClosedParentHover(): void {
        if (this.closedParentPlaylistHover === null) {
            return;
        }

        this.closedParentPlaylistHover.element.classList.remove(PlaylistOrderingManager.hoveredClosedParentClassName);
        clearTimeout(this.closedParentPlaylistHover.startTimeout);
        this.closedParentPlaylistHover = null;
    }

    // MAIN SHORTCUTS
    private get playlists(): PlaylistWithElements[] {
        return this.main.getPlaylists();
    }

    private async refresh(): Promise<void> {
        await this.main.refresh();
    }
};
