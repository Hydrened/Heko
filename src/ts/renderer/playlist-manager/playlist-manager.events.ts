import PlaylistManager from "./playlist-manager.js";
import PlaylistOrderingManager from "./playlist-manager.ordering.js";
import Api from "./../utils/utils.api.js";
import Elements from "../utils/utils.elements.js";
import Functions from "./../utils/utils.functions.js";
import { App } from "./../app.js";
import * as Create from "../utils/utils.create.js";

export default class PlaylistEventsManager {
    public static readonly focusedPlaylistParentClassName: string = "focused";
    private static readonly openedPlaylistParentClassName: string = "opened";

    private readonly orderingManager: PlaylistOrderingManager;

    // INIT
    public constructor(private readonly app: App, private readonly main: PlaylistManager) {
        this.orderingManager = new PlaylistOrderingManager(this.app, this.main);
        this.initEvents();
    }

    private initEvents(): void {
        window.addEventListener("keydown", (e: KeyboardEvent) => this.orderingManager.onWindowKeydown(e));
        window.addEventListener("mousemove", (e: MouseEvent) => this.orderingManager.onWindowMouseMove(e));
        window.addEventListener("mouseup", (e: MouseEvent) => this.orderingManager.onWindowMouseUp(e));

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

        this.onPlaylistsContainerContextmenu(Functions.Geometry.getPosition(e));
    }

    public async onPlaylistContainerClick(playlist: PlaylistWithElements): Promise<void> {
        const hasChildren: boolean = (playlist.childIds.length > 0);

        if (hasChildren) {
            if (playlist.elements === undefined) {
                throw new Error(`Could not open / close playlist: Playlists elements are null.`);
            }

            const opened: boolean = playlist.elements.wrapperElement.classList.toggle(PlaylistEventsManager.openedPlaylistParentClassName);

            const sourcePlaylist = this.playlists.find((p: PlaylistWithElements) => p.id === playlist.id);
            if (sourcePlaylist) {
                sourcePlaylist.opened = opened;
            }

            const setPlaylistOpenedReqRes: SetUserPlaylistOpenedApiResult = await Api.Playlists.setOpened(playlist.id, opened);
            if (!setPlaylistOpenedReqRes.success) {
                throw new Error(setPlaylistOpenedReqRes.error);
            }
        }
        else {
            this.playlists.forEach((p: PlaylistWithElements) => (p.id === playlist.id)
                ? p.elements?.containerElement.classList.add(PlaylistEventsManager.focusedPlaylistParentClassName)
                : p.elements?.containerElement.classList.remove(PlaylistEventsManager.focusedPlaylistParentClassName)
            );

            this.app.currentPlaylistManager.open(playlist.id);
        }
    }

    public onPlaylistContainerMouseDown(e: MouseEvent, playlist: PlaylistWithElements): void {
        this.orderingManager.onPlaylistContainerMouseDown(e, playlist);
    }

    private onPlaylistEdit = async (playlist: Playlist): Promise<void> => {
        const res: void | null = await Create.ManagePlaylistModal.edit(this.playlists, playlist);
        if (res === null) {
            return;
        }

        await this.refresh();
    }

    private onPlaylistRemove = async (playlist: Playlist): Promise<void> => {
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

    private onPlaylistDuplicate = async (playlist: Playlist): Promise<void> => {

    }

    private onPlaylistMergeIn = async (mergeContainerPlaylist: Playlist, playlist: Playlist): Promise<void> => {
        const mergePlaylistInReqRes: MergePlaylistInApiResult = await Api.Playlists.mergeIn(mergeContainerPlaylist.id, playlist.id);
        if (!mergePlaylistInReqRes.success) {
            throw new Error(mergePlaylistInReqRes.error);
        }

        await this.refresh();
    }

    private onPlaylistRemoveFromMerge = async (mergeContainerPlaylist: Playlist, playlist: Playlist): Promise<void> => {
        const removePlaylistFromMergeReqRes: RemovePlaylistFromMergedUserApiResult = await Api.Playlists.removeFromMerge(mergeContainerPlaylist.id, playlist.id);
        if (!removePlaylistFromMergeReqRes.success) {
            throw new Error(removePlaylistFromMergeReqRes.error);
        }

        await this.refresh();
    }
    
    private onPlaylistsContainerContextmenu(position: Position): void {
        Create.playlistsContainerContextmenu({
            position: position,
            onAddPlaylistButtonClick: this.onAddPlaylistButtonClick,
        });
    }

    public onPlaylistContainerContextmenu(position: Position, playlist: Playlist, focusedElement: HTMLElement): void {
        Create.playlistContainerContextmenu({
            position: position,
            focusedElement: focusedElement,

            playlists: this.playlists,
            playlist: playlist,

            onPlaylistEdit: this.onPlaylistEdit,
            onPlaylistRemove: this.onPlaylistRemove,
            onPlaylistDuplicate: this.onPlaylistDuplicate,
            onPlaylistMergeIn: this.onPlaylistMergeIn,
            onPlaylistRemoveFromMerge: this.onPlaylistRemoveFromMerge,
        });
    }

    // MAIN SHORTCUTS
    private get playlists(): PlaylistWithElements[] {
        return this.main.getPlaylists();
    }

    private async refresh(): Promise<void> {
        await this.main.refresh();
    }
};
