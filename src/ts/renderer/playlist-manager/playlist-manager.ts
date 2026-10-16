import PlaylistEventsManager from "./playlist-manager.events.js";
import Api from "./../utils/utils.api.js";
import Elements from "./../utils/utils.elements.js";
import Functions from "./../utils/utils.functions.js";
import { App } from "./../app.js";

export default class PlaylistManager {
    private static readonly visibleClassName: string = "visible";
    private static readonly defaultAnimationDelay: number = 50;

    private eventsManager: PlaylistEventsManager;
    private playlists: PlaylistWithElements[] = [];

    // INIT
    public constructor(private readonly app: App) {
        this.eventsManager = new PlaylistEventsManager(this.app, this);
    }

    private async init(): Promise<void> {
        this.reset();
        await this.loadData();
        this.refresh();
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
        const playlist: PlaylistWithElements = hierarchy.playlist;

        const hasChildren: boolean = (hierarchy.children.length !== 0);
        const hasToBeAnimated: boolean = (playlist.elements === undefined);

        const wrapperElement: HTMLLIElement = document.createElement("li");
        wrapperElement.classList.add("playlist-wrapper");
        parentElement.appendChild(wrapperElement);

        wrapperElement.addEventListener("mousedown", (e: MouseEvent) => this.eventsManager.onPlaylistWrapperMouseDown(e, playlist));

        const containerElement: HTMLElement = document.createElement("div");
        containerElement.classList.add("playlist-container");
        wrapperElement.appendChild(containerElement);

        containerElement.addEventListener("click", () => this.eventsManager.onPlaylistContainerClick(playlist));
        containerElement.addEventListener("contextmenu", (e: PointerEvent) => this.eventsManager.onPlaylistContainerContextmenu({ x: e.x, y: e.y }, playlist, containerElement));

        const thumbnailElement: HTMLElement = document.createElement("div");
        thumbnailElement.classList.add("thumbnail");
        containerElement.appendChild(thumbnailElement);

        Functions.Heko.setThumbnail(thumbnailElement, playlist.thumbnailFileName);

        const detailsContainerElement: HTMLElement = document.createElement("div");
        detailsContainerElement.classList.add("details-container");
        containerElement.appendChild(detailsContainerElement);

        const nameElement: HTMLParagraphElement = document.createElement("h2");
        nameElement.classList.add("name", "one-line-text");
        nameElement.textContent = playlist.name;
        detailsContainerElement.appendChild(nameElement);

        const childrenCountElement: HTMLParagraphElement = document.createElement("h3");
        childrenCountElement.classList.add("children-count", "one-line-text");
        childrenCountElement.textContent = PlaylistManager.getChildrenCountText(playlist);
        detailsContainerElement.appendChild(childrenCountElement);

        const childrenContainerElement: HTMLUListElement = document.createElement("ul");
        childrenContainerElement.classList.add("playlist-children-container");
        wrapperElement.appendChild(childrenContainerElement);

        playlist.elements = {
            wrapperElement: wrapperElement,
            containerElement: containerElement,
            childrenContainerELement: childrenContainerElement,
            nameElement: nameElement,
            childCountElement: childrenCountElement,
        };

        if (playlist.opened) {
            this.eventsManager.onPlaylistContainerClick(playlist);
        }

        if (hasToBeAnimated) {
            index++;
            
            const animationDelay: number = index * PlaylistManager.defaultAnimationDelay;
            setTimeout(() => wrapperElement.classList.add(PlaylistManager.visibleClassName), animationDelay);
        }
        else {
            wrapperElement.classList.add(PlaylistManager.visibleClassName);
        }

        if (hasChildren) {
            const systrayElement: HTMLElement = document.createElement("div");
            systrayElement.classList.add("systray");
            systrayElement.textContent = "❯";
            containerElement.appendChild(systrayElement);

            this.createPlaylists(playlist.elements.childrenContainerELement, hierarchy.children, index);
        }

        return index;
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

    // PUBLIC
    public async open(): Promise<void> {
        await this.init();
    }

    public async refresh(): Promise<void> {
        const playlistElements: Record<ID, PlaylistElements> = Object.fromEntries(this.playlists.flatMap((c: PlaylistWithElements): [ID, PlaylistElements][] => c.elements === undefined ? [] : [[c.id, c.elements]])) as Record<ID, PlaylistElements>;
        await this.loadData();

        this.playlists = this.playlists.map<PlaylistWithElements>((c: PlaylistWithElements) => {
            const elements: PlaylistElements | null = playlistElements[c.id] ?? null;
            if (elements !== null) {
                c.elements = elements;
            }

            return c;
        });

        Functions.Elements.removeChildren(Elements.aside.playlists.container);
        const sortedPlaylists: PlaylistHierarchy[] = PlaylistManager.getSortedPlaylists(this.playlists);
        this.createPlaylists(Elements.aside.playlists.container, sortedPlaylists);
    }

    public getPlaylists(): PlaylistWithElements[] {
        return this.playlists;
    }
};
