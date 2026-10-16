import PlaylistManager from "./playlist-manager.js";
import Api from "./../utils/utils.api.js";
import Elements from "../utils/utils.elements.js";
import Functions from "./../utils/utils.functions.js";
import { App } from "./../app.js";
import * as Create from "../utils/utils.create.js";

export default class PlaylistEventsManager {
    private static readonly movePlaylistModeHoldDuration: number = 750;
    private static readonly openedPlaylistParentClassName: string = "opened";

    private focusedPlaylist: FocusedPlaylist | null = null;

    // INIT
    public constructor(private readonly app: App, private readonly main: PlaylistManager) {
        this.initEvents();
    }

    private initEvents(): void {
        window.addEventListener("mousemove", (e: MouseEvent) => this.onWindowMouseMove(e));
        window.addEventListener("mouseup", (e: MouseEvent) => this.onWindowMouseUp(e));

        Elements.aside.playlists.addButton.addEventListener("click", () => Functions.Elements.antiSpam<void>(Elements.aside.playlists.addButton, async () => {
            await this.onAddPlaylistButtonClick();
        }));

        Elements.aside.playlists.container.addEventListener("contextmenu", (e: PointerEvent) => this.onContainerContextmenu(e));
    }

    // EVENTS
    private async onAddPlaylistButtonClick(): Promise<void> {
        const res: void | null = await Create.ManagePlaylistModal.create(this.playlists);
        if (res === null) {
            return;
        }

        await this.refresh();
    }

    private onContainerContextmenu(e: PointerEvent): void {
        if (e.target !== Elements.aside.playlists.container) {
            return;
        }

        const position: Position = { x: e.x, y: e.y };
        this.onPlaylistsContainerContextmenu(position);
    }

    public async onPlaylistContainerClick(playlist: PlaylistWithElements): Promise<void> {
        const hasChildren: boolean = (playlist.childIds.length > 0);

        if (hasChildren) {
            if (playlist.elements === undefined) {
                throw new Error(`Could not open / close playlist: Playlists elements are null.`);
            }

            const opened: boolean = playlist.elements.wrapperElement.classList.toggle(PlaylistEventsManager.openedPlaylistParentClassName);

            const setPlaylistOpenedReqRes: SetUserPlaylistOpenedApiResult = await Api.Playlists.setOpened(playlist.id, opened);
            if (!setPlaylistOpenedReqRes.success) {
                throw new Error(setPlaylistOpenedReqRes.error);
            }
        }
        else {
            this.app.currentPlaylistManager.open(playlist.id);
        }
    }

    private async onPlaylistEdit(playlist: Playlist): Promise<void> {
        const res: void | null = await Create.ManagePlaylistModal.edit(this.playlists, playlist);
        if (res === null) {
            return;
        }

        await this.refresh();
    }

    private async onPlaylistRemove(playlist: Playlist): Promise<void> {
        const isSure: boolean = await Create.confirmModal(`Are you sure you want to remove playlist named ${playlist.name}?`);
        if (!isSure) {
            return;
        }

        const removePlaylistReqRes: RemoveUserPlaylistApiResult = await Api.Playlists.remove(playlist.id);
        if (!removePlaylistReqRes.success) {
            throw new Error(removePlaylistReqRes.error);
        }

        await this.refresh();
    }

    private async onPlaylistDuplicate(playlist: Playlist): Promise<void> {

    }

    private async onPlaylistMergeIn(mergeContainerPlaylist: Playlist, playlist: Playlist): Promise<void> {
        const mergePlaylistInReqRes: MergePlaylistInApiResult = await Api.Playlists.mergeIn(mergeContainerPlaylist.id, playlist.id);
        if (!mergePlaylistInReqRes.success) {
            throw new Error(mergePlaylistInReqRes.error);
        }

        await this.refresh();
    }

    private async onPlaylistRemoveFromMerge(mergeContainerPlaylist: Playlist, playlist: Playlist): Promise<void> {
        const removePlaylistFromMergeReqRes: RemovePlaylistFromMergedUserApiResult = await Api.Playlists.removeFromMerge(mergeContainerPlaylist.id, playlist.id);
        if (!removePlaylistFromMergeReqRes.success) {
            throw new Error(removePlaylistFromMergeReqRes.error);
        }

        await this.refresh();
    }

    public onPlaylistWrapperMouseDown(e: MouseEvent, playlist: PlaylistWithElements): void {
        const wrapperElement: HTMLElement | null = playlist.elements?.wrapperElement ?? null;
        if (wrapperElement === null) {
            return;
        }

        this.focusedPlaylist = {
            id: playlist.id,
            rect: Functions.Heko.getRect(wrapperElement.getBoundingClientRect()),
            startTime: performance.now(),
            timeout: setTimeout(() => this.onCanMoveFocusedPlaylist(playlist), PlaylistEventsManager.movePlaylistModeHoldDuration),
        };
    }

    private onCanMoveFocusedPlaylist(playlist: PlaylistWithElements): void {
        if (this.focusedPlaylist === null) {
            return;
        }

        console.log(this.playlists.filter((p: PlaylistWithElements) => p.id !== playlist.id));

        this.focusedPlaylist.playlists = this.playlists.filter((p: PlaylistWithElements) => p.id !== playlist.id).map<PlaylistWithRect>((p: PlaylistWithElements) => {
            if (p.elements === undefined) {
                throw new Error(`Could not get playlist rect: Playlist with id = "${p.id}" has no elements.`);
            }

            return {
                ...p,
                rect: Functions.Heko.getRect(p.elements.wrapperElement.getBoundingClientRect()),
            };
        });

        // design
    }

    private onWindowMouseMove(e: MouseEvent): void {
        if (this.focusedPlaylist === null) {
            return;
        }
     
        const mousePosition: Position = Functions.Heko.getPosition(e);

        const isOnSamePlaylist: boolean = Functions.Maths.isPointInRect(this.focusedPlaylist.rect, mousePosition);
        const hasMovedTooSoon: boolean = (performance.now() - this.focusedPlaylist.startTime) < PlaylistEventsManager.movePlaylistModeHoldDuration;

        if (!isOnSamePlaylist && hasMovedTooSoon) {
            clearTimeout(this.focusedPlaylist.timeout);
            this.focusedPlaylist = null;
            return;
        }

        if (this.focusedPlaylist.playlists === undefined) {
            return;
        }

        // const index: number = this.focusedPlaylist.playlists.filter((playlist: PlaylistWithRect) => playlist.id !== this.focusedPlaylist?.id && (playlist.rect.y + playlist.rect.h * 0.5) < mousePosition.y).length;


        // reorder les playlists et les envoyer au update position, le update position va update la position de toutes les playlists par leur index
    }

    private async onWindowMouseUp(e: MouseEvent): Promise<void> {
        if (this.focusedPlaylist == null) {
            return;
        }

        const hasReleasedTooSoon: boolean = (performance.now() - this.focusedPlaylist.startTime) < PlaylistEventsManager.movePlaylistModeHoldDuration;
        if (hasReleasedTooSoon) {
            clearTimeout(this.focusedPlaylist.timeout);
            this.focusedPlaylist = null;
            return;
        }

        // 1. récupérer la position et update la position de la plylist
        // 2. await this.refresh();

        this.focusedPlaylist = null;
    }

    // CONTEXTMENU
    private onPlaylistsContainerContextmenu(position: Position): void {
        const createPlaylistRow: ContextmenuRow = {
            title: "Create playlist",
            shortcut: {
                key: "n",
                ctrl: true,
            },
            onClick: () => this.onAddPlaylistButtonClick(),
        };

        Create.ContextmenuManager.create([createPlaylistRow], position);
    }

    public onPlaylistContainerContextmenu(position: Position, playlist: Playlist, focusedElement: HTMLElement): void {
        const isPlaylistMergeContainer: boolean = (playlist.mergedIds.length > 0);
        const mergeInRows: ContextmenuRow[] = this.getPlaylistContextmenuMergeInRows(playlist);

        const editRow: ContextmenuRow = {
            title: "Edit",
            shortcut: {
                key: "f2",
            },
            onClick: () => this.onPlaylistEdit(playlist),
        };
    
        const removeRow: ContextmenuRow = {
            title: "Remove",
            shortcut: {
                key: "delete",
            },
            onClick: () => this.onPlaylistRemove(playlist),
        };
    
        const duplicateRow: ContextmenuRow = {
            title: "Duplicate",
            shortcut: {
                key: "d",
                ctrl: true,
            },
            onClick: () => this.onPlaylistDuplicate(playlist),
            disabled: true,
        };
    
        const mergeInRow: ContextmenuRow = {
            title: "Merge in",
            rows: mergeInRows,
            disabled: isPlaylistMergeContainer,
        };
        
        const removeFromMergeRow: ContextmenuRow = {
            title: "Remove from merge",
            rows: this.getPlaylistContextmenuRemoveFromMergeRows(playlist),
        };

        const rows: ContextmenuRow[] = [editRow, removeRow, duplicateRow, mergeInRow];
        if (removeFromMergeRow.rows?.length ?? 0 > 0) {
            rows.push(removeFromMergeRow);
        }
    
        Create.ContextmenuManager.create(rows, position, focusedElement);
    }

    // OTHER
    private getPlaylistContextmenuMergeInRows(playlist: Playlist): ContextmenuRow[] {
        const filteredPlaylists: Playlist[] = this.playlists.filter((p: Playlist) => {
            const isCurrentPlaylist: boolean = (p.id === playlist.id);
            const isChild: boolean = Functions.Heko.isPlaylistChild(this.playlists, playlist.id, p.id);
            const isParent: boolean = Functions.Heko.isPlaylistParent(this.playlists, p.id, playlist.id);
            const isSongContainer: boolean = (p.songIds.length > 0);
            const isPlaylistContainer: boolean = (p.childIds.length > 0);
            const isAlreadyMergedIn: boolean = p.mergedIds.includes(playlist.id);
            const isInMergeContainer: boolean = this.playlists.some((p2: Playlist) => p2.mergedIds.includes(p.id));

            return !isCurrentPlaylist && !isChild && !isParent && !isSongContainer && !isPlaylistContainer && !isAlreadyMergedIn && !isInMergeContainer;
        });
        
        return filteredPlaylists.map<ContextmenuRow>((p: Playlist) => ({
            title: p.name,
            onClick: () => this.onPlaylistMergeIn(p, playlist),
        }));
    }

    private getPlaylistContextmenuRemoveFromMergeRows(playlist: Playlist): ContextmenuRow[] {
        const filteredPlaylists: Playlist[] = this.playlists.filter((p: Playlist) => p.mergedIds.includes(playlist.id));

        return filteredPlaylists.map<ContextmenuRow>((p: Playlist) => ({
            title: p.name,
            onClick: () => this.onPlaylistRemoveFromMerge(p, playlist),
        }));
    }

    // MAIN SHORTCUTS
    private get playlists(): PlaylistWithElements[] {
        return this.main.getPlaylists();
    }

    private async refresh(): Promise<void> {
        await this.main.refresh();
    }
};
