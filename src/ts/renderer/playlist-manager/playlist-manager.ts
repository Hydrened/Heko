import Api from "./../utils/utils.api.js";
import Elements from "./../utils/utils.elements.js";
import Functions from "./../utils/utils.functions.js";
import { App } from "./../app.js";
import * as Create from "./../utils/utils.create.js";

export default class PlaylistManager {
    private static readonly visibleClassName: string = "visible";
    private static readonly defaultAnimationDelay: number = 50;

    private playlists: PlaylistWithElements[] = [];

    // INIT
    public constructor(private readonly app: App) {
        this.initEvents();
    }

    private async init(): Promise<void> {
        this.reset();
        await this.loadData();
        this.refresh();
    }

    private initEvents(): void {
        Elements.aside.playlists.addButton.addEventListener("click", () => Functions.Elements.antiSpam<void>(Elements.aside.playlists.addButton, async () => {
            await this.onAddPlaylistButtonClick();
        }));

        Elements.aside.playlists.container.addEventListener("contextmenu", (e: PointerEvent) => this.onContainerContextmenu(e));
    }

    private async loadData(): Promise<void> {
        const getUserPlaylistsReqRes: GetUserPlaylistsApiResult = await Api.Playlists.getAll();
        if (!getUserPlaylistsReqRes.success) {
            throw new Error(getUserPlaylistsReqRes.error);
        }

        this.playlists = getUserPlaylistsReqRes.playlists;
    }

    private createPlaylists(parentElement: HTMLUListElement, hierarchies: PlaylistHierarchy[], parentIndex: number = 0): void {
        hierarchies.forEach((hierarchy: PlaylistHierarchy) => parentIndex = this.createPlaylist(parentElement, hierarchy, parentIndex));
    }

    private createPlaylist(parentElement: HTMLUListElement, hierarchy: PlaylistHierarchy, index: number): number {
        const hasToBeInstant: boolean = (hierarchy.playlist.elements !== undefined);

        const wrapperElement: HTMLLIElement = document.createElement("li");
        wrapperElement.classList.add("playlist-wrapper");
        parentElement.appendChild(wrapperElement);

        const containerElement: HTMLElement = document.createElement("div");
        containerElement.classList.add("playlist-container");
        wrapperElement.appendChild(containerElement);

        containerElement.addEventListener("click", () => this.onPlaylistContainerClick(hierarchy.playlist));
        containerElement.addEventListener("contextmenu", (e: PointerEvent) => this.onPlaylistContainerContextmenu({ x: e.x, y: e.y }, hierarchy.playlist, containerElement));

        const thumbnailElement: HTMLElement = document.createElement("div");
        thumbnailElement.classList.add("thumbnail");
        containerElement.appendChild(thumbnailElement);

        Functions.Heko.setThumbnail(thumbnailElement, hierarchy.playlist.thumbnailFileName);

        const detailsContainerElement: HTMLElement = document.createElement("div");
        detailsContainerElement.classList.add("details-container");
        containerElement.appendChild(detailsContainerElement);

        const nameElement: HTMLParagraphElement = document.createElement("h2");
        nameElement.classList.add("name", "one-line-text");
        nameElement.textContent = hierarchy.playlist.name;
        detailsContainerElement.appendChild(nameElement);

        const childrenCountElement: HTMLParagraphElement = document.createElement("h3");
        childrenCountElement.classList.add("children-count", "one-line-text");
        childrenCountElement.textContent = PlaylistManager.getChildrenCountText(hierarchy.playlist);
        detailsContainerElement.appendChild(childrenCountElement);

        const childrenContainerElement: HTMLUListElement = document.createElement("ul");
        childrenContainerElement.classList.add("playlist-children-container");
        wrapperElement.appendChild(childrenContainerElement);

        hierarchy.playlist.elements = {
            wrapperElement: wrapperElement,
            containerElement: containerElement,
            childrenContainerELement: childrenContainerElement,
            nameElement: nameElement,
            childCountElement: childrenCountElement,
        };

        if (hasToBeInstant) {
            wrapperElement.classList.add(PlaylistManager.visibleClassName);
            this.createPlaylists(hierarchy.playlist.elements.childrenContainerELement, hierarchy.children, index);
            return index;
        }

        index++;
        const animationDelay: number = index * PlaylistManager.defaultAnimationDelay;
        setTimeout(() => wrapperElement.classList.add(PlaylistManager.visibleClassName), animationDelay);

        if (hierarchy.playlist.elements === undefined) {
            throw new Error(`Could not create playlist: Playlist elements are null.`);
        }

        this.createPlaylists(hierarchy.playlist.elements.childrenContainerELement, hierarchy.children, index);
        return index;
    }

    // EVENTS
    private async onAddPlaylistButtonClick(): Promise<void> {
        const res: void | null = await Create.ManagePlaylistModal.create(this.playlists);
        if (res === null) {
            return;
        }

        await this.refresh(true);
    }

    private onContainerContextmenu(e: PointerEvent): void {
        if (e.target !== Elements.aside.playlists.container) {
            return;
        }

        const position: Position = { x: e.x, y: e.y };

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

    private onPlaylistContainerClick(playlist: Playlist): void {
        this.app.currentPlaylistManager.open(playlist.id);
    }

    private onPlaylistContainerContextmenu(position: Position, playlist: Playlist, focusedElement: HTMLElement): void {
        const isPlaylistMergeContainer: boolean = (playlist.mergedIds.length > 0);

        const editRow: ContextmenuRow = {
            title: "Edit",
            shortcut: {
                key: "f2",
            },
            onClick: () => this.onEdit(playlist),
        };
    
        const removeRow: ContextmenuRow = {
            title: "Remove",
            shortcut: {
                key: "delete",
            },
            onClick: () => this.onRemove(playlist),
        };
    
        const duplicateRow: ContextmenuRow = {
            title: "Duplicate",
            shortcut: {
                key: "d",
                ctrl: true,
            },
            onClick: () => {},
            disabled: true,
        };
    
        const mergeInRow: ContextmenuRow = {
            title: "Merge in",
            rows: this.getPlaylistContextmenuMergeInRows(playlist),
            disabled: isPlaylistMergeContainer,
        };

        Create.ContextmenuManager.create([editRow, removeRow, duplicateRow, mergeInRow], position, focusedElement);
    }

    private async onEdit(playlist: Playlist): Promise<void> {
        const res: void | null = await Create.ManagePlaylistModal.edit(this.playlists, playlist);
        if (res === null) {
            return;
        }

        await this.refresh(true);
    }

    private async onRemove(playlist: Playlist): Promise<void> {
        const isSure: boolean = await Create.confirmModal(`Are you sure you want to remove playlist named ${playlist.name}?`);
        if (!isSure) {
            return;
        }

        const removePlaylistReqRes: RemoveUserPlaylistApiResult = await Api.Playlists.remove(playlist.id);
        if (!removePlaylistReqRes.success) {
            throw new Error(removePlaylistReqRes.error);
        }

        await this.refresh(true);
    }

    private async onMergeIn(mergeContainerPlaylist: Playlist, playlist: Playlist): Promise<void> {
        const mergePlaylistInReqRes: MergePlaylistInApiResult = await Api.Playlists.mergeIn(mergeContainerPlaylist.id, playlist.id);
        if (!mergePlaylistInReqRes.success) {
            throw new Error(mergePlaylistInReqRes.error);
        }

        await this.refresh();
    }

    // OTHER
    private static getSortedPlaylists(playlists: Playlist[]): PlaylistHierarchy[] {
        const hierarchyMap: Map<ID, PlaylistHierarchy> = new Map();
        const roots: PlaylistHierarchy[] = [];

        for (const playlist of playlists) {
            hierarchyMap.set(playlist.id, { playlist: playlist, children: [] });
        }

        for (const playlist of playlists) {
            const node: PlaylistHierarchy = hierarchyMap.get(playlist.id)!;

            if (playlist.parentId === null) {
                roots.push(node);
                continue;
            }

            const parent: PlaylistHierarchy | null = hierarchyMap.get(playlist.parentId) ?? null;
            if (parent === null) {
                roots.push(node);
                continue;
            }

            parent.children.push(node);
        }

        const sort = (nodes: PlaylistHierarchy[]): void => {
            nodes.sort((a: PlaylistHierarchy, b: PlaylistHierarchy) => a.playlist.position - b.playlist.position);

            for (const node of nodes) {
                sort(node.children);
            }
        };

        sort(roots);
        return roots;
    }

    private static getChildrenCountText(playlist: Playlist): string {
        const childCount: number = playlist.childIds.length;
        const mergeCount: number = playlist.mergedIds.length;
        const songCount: number = playlist.songIds.length;

        if (childCount !== 0) {
            return `${childCount} ${Functions.Strings.pluralize("playlist", "playlists", childCount)}`;
        }

        if (mergeCount !== 0) {
            return `${mergeCount} ${Functions.Strings.pluralize("merged playlist", "merged playlists", mergeCount)}`;
        }

        return `${songCount} ${Functions.Strings.pluralize("song", "songs", songCount)}`;
    }

    private reset(): void {
        this.playlists = [];
        // remove playlists with animation
    }

    private async refresh(reload: boolean = false): Promise<void> {
        if (reload) {
            const playlistElements: Record<ID, PlaylistElements> = Object.fromEntries(this.playlists.flatMap((c: PlaylistWithElements): [ID, PlaylistElements][] => c.elements === undefined ? [] : [[c.id, c.elements]])) as Record<ID, PlaylistElements>;
            await this.loadData();

            this.playlists = this.playlists.map<PlaylistWithElements>((c: PlaylistWithElements) => {
                const elements: PlaylistElements | null = playlistElements[c.id] ?? null;
                if (elements !== null) {
                    c.elements = elements;
                }

                return c;
            });
        }

        Functions.Elements.removeChildren(Elements.aside.playlists.container);
        const sortedPlaylists: PlaylistHierarchy[] = PlaylistManager.getSortedPlaylists(this.playlists);
        this.createPlaylists(Elements.aside.playlists.container, sortedPlaylists);
    }

    private getPlaylistContextmenuMergeInRows(playlist: Playlist): ContextmenuRow[] {
        const filteredPlaylists: Playlist[] = this.playlists.filter((p: Playlist) => {
            const isCurrentPlaylist: boolean = (p.id === playlist.id);
            const isChild: boolean = Functions.Heko.isPlaylistChild(this.playlists, playlist.id, p.id);
            const isParent: boolean = Functions.Heko.isPlaylistParent(this.playlists, p.id, playlist.id);
            const isSongContainer: boolean = (p.songIds.length > 0);
            const isPlaylistContainer: boolean = (p.childIds.length > 0);
            const isAlreadyMergedIn: boolean = p.mergedIds.includes(playlist.id);

            return !isCurrentPlaylist && !isChild && !isParent && !isSongContainer && !isPlaylistContainer && !isAlreadyMergedIn;
        });
        
        return filteredPlaylists.map<ContextmenuRow>((p: Playlist) => ({
            title: p.name,
            onClick: () => this.onMergeIn(p, playlist),
        }));
    }

    // PUBLIC
    public async open(): Promise<void> {
        await this.init();
    }
};
