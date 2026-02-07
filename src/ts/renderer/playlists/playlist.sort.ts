import App from "./../app.js";
import PlaylistManager from "./playlists.js";
import * as Elements from "./../utils/utils.elements.js";
import * as Functions from "./../utils/utils.functions.js";

export default class PlaylistsSortManager {
    private readonly sortedByClassListName: string = "sorted-by";
    private readonly orderAttributeName: string = "order";
    private readonly sortAttributeName: string = "sort";

    constructor(private app: App, private main: PlaylistManager) {

    }

    public sort(buttonElement: HTMLButtonElement): void {
        const currentOpenedPlaylist: Playlist | null = this.main.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }

        const isMergeContainer: boolean = (currentOpenedPlaylist.mergedPlaylist.length != 0);
        const containerElement: HTMLElement = (isMergeContainer ? Elements.currentPlaylist.merged.container : Elements.currentPlaylist.song.container);

        const isAlreadySortedBySameType: boolean = buttonElement.classList.contains(this.sortedByClassListName);
        if (isAlreadySortedBySameType) {
            this.swapButtonOrder(buttonElement);
            Functions.reverseChildren(containerElement);
            return;
        }

        this.setButtonSortedBy(buttonElement);

        (isMergeContainer)
            ? this.sortMergeContainer(buttonElement)
            : this.sortSongContainer(buttonElement);
    }

    public sortMergeContainer(buttonElement: HTMLButtonElement): void {
        const containerElement: HTMLElement = Elements.currentPlaylist.merged.container;
        const sortType: MergeSortType = (buttonElement.getAttribute(this.sortAttributeName) as MergeSortType);

        const playlistElements: HTMLElement[] = ([...containerElement.children] as HTMLElement[]);

        playlistElements.sort((a: HTMLElement, b: HTMLElement) => {
            const aIndex: number = Number(a.querySelector("p")?.textContent ?? "0");
            const bIndex: number = Number(b.querySelector("p")?.textContent ?? "0");

            const aPlaylist: Playlist | null = this.main.getPlaylistFromElement(a);
            const bPlaylist: Playlist | null = this.main.getPlaylistFromElement(b);

            switch (sortType) {
                case "id": return aIndex - bIndex;

                case "name": return (aPlaylist?.name ?? "").localeCompare((bPlaylist?.name ?? ""));

                case "nb-songs": return this.getPlaylistNbSong(aPlaylist) - this.getPlaylistNbSong(bPlaylist);

                case "duration": return this.getPlaylistDuration(aPlaylist) - this.getPlaylistDuration(bPlaylist);

                default: return 0;
            }
        });

        playlistElements.forEach((c: HTMLElement) => containerElement.appendChild(c));
    }

    public sortSongContainer(buttonElement: HTMLButtonElement): void {
        const containerElement: HTMLElement = Elements.currentPlaylist.song.container;
        const sortType: SongSortType = (buttonElement.getAttribute(this.sortAttributeName) as SongSortType);

        const playlistElements: HTMLElement[] = ([...containerElement.children] as HTMLElement[]);

        playlistElements.sort((a: HTMLElement, b: HTMLElement) => {
            const aIndex: number = Number(a.querySelector("p")?.textContent ?? "0");
            const bIndex: number = Number(b.querySelector("p")?.textContent ?? "0");

            const aSong: Song | null = this.main.getSongFromElement(a);
            const bSong: Song | null = this.main.getSongFromElement(b);

            switch (sortType) {
                case "id": return aIndex - bIndex;

                case "title": return (aSong?.title ?? "").localeCompare(bSong?.title ?? "");

                case "artist": return (aSong?.artist ?? "").localeCompare(bSong?.artist ?? "");

                case "duration": return (aSong?.duration ?? 0) - (bSong?.duration ?? 0);

                default: return 0;
            }
        });

        playlistElements.forEach((c: HTMLElement) => containerElement.appendChild(c));
    }

    private swapButtonOrder(buttonElement: HTMLButtonElement): void {
        const hasNoOrderAttributes: boolean = !buttonElement.hasAttribute(this.orderAttributeName);
        if (hasNoOrderAttributes) {
            return;
        }

        const orderAttribute: string = buttonElement.getAttribute(this.orderAttributeName)!;
        const newOrderAttribute: string = ((orderAttribute == "asc") ? "desc" : "asc");
        buttonElement.setAttribute(this.orderAttributeName, newOrderAttribute);
    }

    private getPlaylistNbSong(playlist: Playlist | null): number {
        return (playlist?.songs.length ?? 0);
    }

    private getPlaylistDuration(playlist: Playlist | null): number {
        return (playlist?.songs.reduce((acc: number, song: Song) => acc + song.duration, 0) ?? 0);
    }

    private setButtonSortedBy(buttonElement: HTMLButtonElement): void {
        const sortButtons: HTMLButtonElement[] = Object.values(Elements.currentPlaylist.song.sort).concat(Object.values(Elements.currentPlaylist.merged.sort));
        sortButtons.forEach((b: HTMLElement) => {
            b.classList.remove(this.sortedByClassListName);
            b.removeAttribute(this.orderAttributeName);
        });

        buttonElement.classList.add(this.sortedByClassListName);
        buttonElement.setAttribute(this.orderAttributeName, "asc");
    }
};
