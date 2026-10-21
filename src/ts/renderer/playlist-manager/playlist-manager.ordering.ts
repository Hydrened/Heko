import PlaylistManager from "./playlist-manager.js";
import Api from "./../utils/utils.api.js";
import Elements from "./../utils/utils.elements.js";
import Functions from "./../utils/utils.functions.js";
import { App } from "./../app.js";

export default class PlaylistOrderingManager {
    private static readonly moveingMoveClassName: string = "moving-mode";
    
    private static readonly movingPlaylistClassName: string = "moving";
    private static readonly movingPlaylistWillMoveInClassName: string = "will-move-in";

    private static readonly hoveredPlaylistTopIndicationClassName: string = "move-top-indication";
    private static readonly hoveredPlaylistBottomIndicationClassName: string = "move-bottom-indication";
    private static readonly hoveredClosedParentClassName: string = "move-hover-opening";

    private static readonly focusedPlaylistMinMoveDistance: number = 30;
    private static readonly playlistHoldDuration: number = 750;

    private readonly elements = Elements.aside;

    private tempFocusedPlaylist: TempFocusedPlaylist | null = null;
    private focusedPlaylist: FocusedPlaylist | null = null;

    private closedParentPlaylistHover: PlaylistHoverHandler | null = null;

    public constructor(private readonly app: App, private readonly main: PlaylistManager) {}  

    public onWindowKeydown(e: KeyboardEvent): void {
        if (e.key !== "Escape" || this.focusedPlaylist === null) {
            return;
        }

        this.cancelFocusedPlaylist();
        this.cancelClosedParentPlaylistHover();
        this.removeMoveIndications();
    }

    public onPlaylistContainerMouseDown(e: MouseEvent, playlist: PlaylistWithElements): void {
        const containerElement: HTMLElement | null = playlist.elements?.containerElement ?? null;
        if (containerElement === null) {
            return;
        }

        this.tempFocusedPlaylist = {
            playlist: playlist,
            mousePositionStart: Functions.Geometry.getPosition(e),
        };
    }

    public onWindowMouseMove(e: MouseEvent): void {
        const mousePosition: Position = Functions.Geometry.getPosition(e);

        if (this.tempFocusedPlaylist !== null) {
            this.initFocusedPlaylist(mousePosition);
        }

        if (this.focusedPlaylist === null) {
            return;
        }

        this.refreshFocusedPlaylistPosition(mousePosition);
        this.cancelClosedParentHoverIfLeft(mousePosition);

        this.initClosedParentPlaylistHoverIfNeeded(mousePosition);
        this.setMoveIndications(mousePosition);
    }

    public async onWindowMouseUp(e: MouseEvent): Promise<void> {
        this.removeMoveIndications();

        if (this.closedParentPlaylistHover !== null) {
            this.cancelClosedParentPlaylistHover();
        }

        if (this.focusedPlaylist === null && this.tempFocusedPlaylist !== null) {
            this.tempFocusedPlaylist = null;
            return;
        }

        if (this.focusedPlaylist == null) {
            return;
        }
        
        const mousePosition: Position = Functions.Geometry.getPosition(e);
        const hoveredPlaylist: PlaylistWithRect | null = this.getHoveredPlaylist(mousePosition);
        if (hoveredPlaylist === null) {
            this.cancelFocusedPlaylist();
            return;
        }
        
        if (hoveredPlaylist.id === this.focusedPlaylist.id) {
            this.cancelFocusedPlaylist();
            return;
        }

        const moveData: MovePlaylistPositionData = this.getMovePlaylistPositionData(mousePosition, hoveredPlaylist);
        this.cancelFocusedPlaylist();
        
        const updatePlaylistPositionReqRes: SetUserPlaylistPositionApiResult = await Api.Playlists.setPosition(moveData.id, moveData.parentId, moveData.position);
        if (!updatePlaylistPositionReqRes.success) {
            throw new Error(updatePlaylistPositionReqRes.error);
        }

        await this.refresh();
    }

    // INIT
    private initFocusedPlaylist(mousePosition: Position): void {
        if (this.tempFocusedPlaylist === null) {
            return;
        }

        const distance: number = Functions.Geometry.getDistance(this.tempFocusedPlaylist.mousePositionStart, mousePosition);
        if (distance < PlaylistOrderingManager.focusedPlaylistMinMoveDistance) {
            return;
        }

        const playlist: PlaylistWithElements = this.tempFocusedPlaylist.playlist;

        if (playlist.elements === undefined) {
            throw new Error(`Could not init focused playlist: Playlist with id = "${playlist.id}" has no elements.`);
        }

        this.elements.playlists.container.classList.add(PlaylistOrderingManager.moveingMoveClassName);

        const rect: Rect = Functions.Geometry.getRect(playlist.elements.containerElement.getBoundingClientRect());
        const offset: Position = { x: this.tempFocusedPlaylist.mousePositionStart.x - rect.x, y: this.tempFocusedPlaylist.mousePositionStart.y - rect.y - (this.tempFocusedPlaylist.mousePositionStart.y - rect.y) * 1 / 3 };

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
            defaultElement: playlist.elements.wrapperElement,
            movingElement: playlistContainerElement,
            rect: rect,
            offset: offset,
            playlistRects: [],
        };

        if (playlist.childIds.length > 0 && playlist.opened) {
            this.main.getEventManager().onPlaylistContainerClick(playlist);
        }

        playlist.elements.wrapperElement.classList.add(PlaylistOrderingManager.movingPlaylistClassName);
        this.refreshFocusedPlaylistRects();
        this.refreshFocusedPlaylistPosition(mousePosition);

        this.tempFocusedPlaylist = null;
    }

    private initClosedParentPlaylistHoverIfNeeded(mousePosition: Position): void {
        if (this.focusedPlaylist === null) {
            return;
        }

        const hoveredPlaylist: PlaylistWithRect | null = this.focusedPlaylist.playlistRects.find((p: PlaylistWithRect) => Functions.Geometry.isPointInRect(p.containerRect, mousePosition)) ?? null;
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
            rect: hoveredPlaylist.containerRect,
            startTime: performance.now(),
            startTimeout: setTimeout(() => {
                this.main.getEventManager().onPlaylistContainerClick(hoveredPlaylist);
                this.refreshFocusedPlaylistRects();
            }, PlaylistOrderingManager.playlistHoldDuration),
        };
    }

    // REFRESH
    private refreshFocusedPlaylistRects(): void {
        if (this.focusedPlaylist === null) {
            return;
        }

        this.cancelClosedParentPlaylistHover();
        this.focusedPlaylist.playlistRects = this.getVisiblePlaylists();
    }

    private refreshFocusedPlaylistPosition(mousePosition: Position): void {
        if (this.focusedPlaylist === null) {
            return;
        }

        const focusedPlaylistElementPosition: Position = {
            x: mousePosition.x - this.focusedPlaylist.offset.x,
            y: mousePosition.y - this.focusedPlaylist.offset.y,
        };

        this.focusedPlaylist.movingElement.style.left = `${focusedPlaylistElementPosition.x}px`;
        this.focusedPlaylist.movingElement.style.top = `${focusedPlaylistElementPosition.y}px`;
    }

    // CANCEL
    private cancelClosedParentHoverIfLeft(mousePosition: Position): void {
        if (this.closedParentPlaylistHover === null) {
            return;
        }

        const isStillInsideRect: boolean = PlaylistOrderingManager.isStillInsideRect(mousePosition, this.closedParentPlaylistHover.rect, this.closedParentPlaylistHover.startTime);
        if (!isStillInsideRect) {
            this.cancelClosedParentPlaylistHover();
        }
    }

    private cancelFocusedPlaylist(): void {
        if (this.focusedPlaylist === null) {
            return;
        }

        this.elements.playlists.container.classList.remove(PlaylistOrderingManager.moveingMoveClassName);

        this.focusedPlaylist.defaultElement.classList.remove(PlaylistOrderingManager.movingPlaylistClassName);
        this.focusedPlaylist.movingElement.remove();
        this.focusedPlaylist = null;
    }

    private cancelClosedParentPlaylistHover(): void {
        if (this.closedParentPlaylistHover === null) {
            return;
        }

        this.closedParentPlaylistHover.element.classList.remove(PlaylistOrderingManager.hoveredClosedParentClassName);
        clearTimeout(this.closedParentPlaylistHover.startTimeout);
        this.closedParentPlaylistHover = null;
    }

    // OTHER
    private static isStillInsideRect(mousePosition: Position, rect: Rect, startTime: number): boolean {
        const isOnSameRect: boolean = Functions.Geometry.isPointInRect(rect, mousePosition);
        const hasMovedTooSoon: boolean = ((performance.now() - startTime) < PlaylistOrderingManager.playlistHoldDuration);

        if (!isOnSameRect && hasMovedTooSoon) {
            return false;
        }

        return true;
    }

    private getVisiblePlaylists(): PlaylistWithRect[] {
        const getFilteredPlaylists = (acc: PlaylistWithElements[], hierarchy: PlaylistHierarchy<PlaylistWithElements>[]): PlaylistWithElements[] => {
            hierarchy.forEach((h: PlaylistHierarchy<PlaylistWithElements>) => {
                acc.push(h.playlist);

                if (h.playlist.opened) {
                    acc = getFilteredPlaylists(acc, h.children);
                }
            });

            return acc;
        };

        return getFilteredPlaylists([], this.playlistHierarchy).map<PlaylistWithRect>((p: PlaylistWithElements) => {
            if (p.elements === undefined) {
                throw new Error(`Could not get playlists rectangles: Playlist with id = "${p.id}" has no elements.`);
            }

            let moveInZoneRect: Rect | undefined = undefined;
            if (p.elements.moveInZoneElement !== undefined) {
                moveInZoneRect = Functions.Geometry.getRect(p.elements.moveInZoneElement.getBoundingClientRect());
            }

            return { 
                ...p,
                containerRect: Functions.Geometry.getRect(p.elements.containerElement.getBoundingClientRect()),
                moveInZoneRect: moveInZoneRect,
            };
        }).sort((a: PlaylistWithRect, b: PlaylistWithRect) => a.containerRect.y - b.containerRect.y);
    }

    private getHoveredPlaylist(mousePosition: Position): PlaylistWithRect | null {
        if (this.focusedPlaylist === null) {
            return null;
        }

        return this.focusedPlaylist.playlistRects.reduce((acc: PlaylistWithRect | null, p: PlaylistWithRect) => {
            if (acc === null) {
                return p;
            }

            const accDistance: number = Math.abs(Functions.Geometry.getRectCenterY(acc.containerRect) - mousePosition.y);
            const pDistance: number = Math.abs(Functions.Geometry.getRectCenterY(p.containerRect) - mousePosition.y);

            return (accDistance < pDistance) ? acc : p;
        }, null);
    }

    private getMovePlaylistPositionData(mousePosition: Position, hoveredPlaylist: PlaylistWithRect): MovePlaylistPositionData {
        const errorBase: string = "Could not get move playlist position data";

        if (this.focusedPlaylist === null) {
            throw new Error(`${errorBase}: Focused playlist is null.`);
        }

        if (hoveredPlaylist.elements === undefined) {
            throw new Error(`${errorBase}: Hovered playlist with id = "${hoveredPlaylist.id}" has no elements.`);
        }

        const playlistId: ID = this.focusedPlaylist.id;
        const moveIn: boolean = (hoveredPlaylist.moveInZoneRect === undefined) ? false : (hoveredPlaylist.id === playlistId) ? false : Functions.Geometry.isPointInRect(hoveredPlaylist.moveInZoneRect, mousePosition);

        let parentId: number = -1;
        let position: number = -1;

        if (!moveIn) {
            const hoveredOnTop: boolean = Functions.Geometry.getRectCenterY(hoveredPlaylist.containerRect) > mousePosition.y;
            const isOpenedParentPlaylist: boolean = (hoveredPlaylist.childIds.length > 0 && hoveredPlaylist.opened && !hoveredOnTop);

            parentId = (isOpenedParentPlaylist ? hoveredPlaylist.id : hoveredPlaylist.parentId);

            const hoveredScopePlaylists: Playlist[] = this.playlists.filter((p: Playlist) => p.parentId === parentId && p.id !== playlistId).sort((a: Playlist, b: Playlist) => a.position - b.position);
            
            const hoveredPlaylistIndex: number = hoveredScopePlaylists.findIndex((p: Playlist) => p.id === hoveredPlaylist.id);
            const siblingPlaylistIndex: number = (hoveredPlaylistIndex === -1) ? 0 : (hoveredOnTop ? hoveredPlaylistIndex - 1 : hoveredPlaylistIndex + 1);

            const firstIndex: number = Math.min(hoveredPlaylistIndex, siblingPlaylistIndex);
            const secondIndex: number = Math.max(hoveredPlaylistIndex, siblingPlaylistIndex);

            const firstPlaylist: Playlist | null = hoveredScopePlaylists[firstIndex] ?? null;
            const secondPlaylist: Playlist | null = hoveredScopePlaylists[secondIndex] ?? null;

            const firstPosition: number = firstPlaylist?.position ?? 0;
            const secondPosition: number = secondPlaylist?.position ?? 2_147_483_647;

            position = (firstPosition + secondPosition) * 0.5;
        }
        else {
            parentId = hoveredPlaylist.id;
            position = 1;
        }

        return { 
            id: playlistId,
            parentId: parentId,
            position: position,
        };
    }

    private setMoveIndications(mousePosition: Position): void {
        this.removeMoveIndications();

        if (this.focusedPlaylist === null) {
            return;
        }

        const hoveredPlaylist: PlaylistWithRect | null = this.getHoveredPlaylist(mousePosition);
        if (hoveredPlaylist === null) {
            return;
        }

        if (hoveredPlaylist.elements === undefined) {
            throw new Error(`Could not set move indications: Hovered playlist with id = "${hoveredPlaylist.id}" has no elements.`);
        }

        const isInMoveInZone: boolean = (hoveredPlaylist.moveInZoneRect == undefined) ? false : Functions.Geometry.isPointInRect(hoveredPlaylist.moveInZoneRect, mousePosition);
        if (isInMoveInZone) {
            this.focusedPlaylist.movingElement.classList.add(PlaylistOrderingManager.movingPlaylistWillMoveInClassName);
            return;
        }
        
        const onTop: boolean = Functions.Geometry.getRectCenterY(hoveredPlaylist.containerRect) > mousePosition.y;
        const className: string = (onTop) ? PlaylistOrderingManager.hoveredPlaylistTopIndicationClassName : PlaylistOrderingManager.hoveredPlaylistBottomIndicationClassName;
        hoveredPlaylist.elements.containerElement.classList.add(className);
    }

    private removeMoveIndications(): void {
        this.focusedPlaylist?.movingElement.classList.remove(PlaylistOrderingManager.movingPlaylistWillMoveInClassName);

        this.playlists.forEach((p: PlaylistWithElements) => p.elements?.containerElement.classList.remove(
            PlaylistOrderingManager.hoveredPlaylistTopIndicationClassName,
            PlaylistOrderingManager.hoveredPlaylistBottomIndicationClassName,
        ));
    }

    // MAIN SHORTCUTS
    private get playlists(): PlaylistWithElements[] {
        return this.main.getPlaylists();
    }

    private get playlistHierarchy(): PlaylistHierarchy<PlaylistWithElements>[] {
        return this.main.getPlaylistHierarchy();
    }

    private async refresh(): Promise<void> {
        await this.main.refresh();
    }
};
