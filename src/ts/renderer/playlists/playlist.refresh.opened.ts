import App from "./../app.js";
import PlaylistManager from "./playlists.js";
import * as Api from "./../utils/utils.api.js";
import * as Functions from "./../utils/utils.functions.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistsRefreshOpenedManager {
    constructor(private app: App, private main: PlaylistManager) {

    }

    public refresh(): void {
        this.refreshDetails();
        this.refreshAddSongButton();
        this.refreshPlayButton();
        this.refreshMainContainer();
    }

    private refreshDetails(): void {
        const thumbnailElement: HTMLElement = (Elements.currentPlaylist.details.thumbnail as HTMLElement);
        thumbnailElement.classList.remove("null");
        thumbnailElement.style.backgroundImage = "";
        Elements.currentPlaylist.details.title.textContent = "";
        Elements.currentPlaylist.details.songNumber.textContent = "";
        Elements.currentPlaylist.details.duration.textContent = "";
        Elements.currentPlaylist.addSongsButton.classList.add("disabled");

        const currentOpenedPlaylist: Playlist | null = this.main.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }

        const isMergedContainer: boolean = (currentOpenedPlaylist.mergedPlaylist.length != 0);
        const songs: Song[] = ((isMergedContainer)
            ? this.main.getMergedContainerSongs(currentOpenedPlaylist, false)
            : currentOpenedPlaylist.songs);

        Functions.setThumbnail(thumbnailElement, currentOpenedPlaylist.thumbnailFileName);

        Elements.currentPlaylist.details.title.textContent = currentOpenedPlaylist.name;

        const nbSongs: number = songs.length;
        Elements.currentPlaylist.details.songNumber.textContent = `${nbSongs} ${Functions.pluralize("song", nbSongs)}`;

        const playlistDuration: number = songs.reduce((acc: number, song: Song) => acc + song.duration, 0);
        const formatPlatlistDuration: string = Functions.formatDuration(playlistDuration);
        Elements.currentPlaylist.details.duration.textContent = formatPlatlistDuration;

        Elements.currentPlaylist.songFilterInput.value = "";
    }

    private refreshAddSongButton(): void {
        const currentOpenedPlaylist: Playlist | null = this.main.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }

        if (currentOpenedPlaylist.mergedPlaylist.length != 0) {
            Elements.currentPlaylist.addSongsButton.classList.add("disabled");
            return;
        }

        const playlistSongIDs: number[] = currentOpenedPlaylist.songs.map((song: Song) => song.id);
        const everyUserSongIDs: number[] = (this.main.getSongBuffer()).map((song: Song) => song.id);

        const canUserAddSongs: boolean = everyUserSongIDs.some((id: ID) => !playlistSongIDs.includes(id));
        if (canUserAddSongs) {
            Elements.currentPlaylist.addSongsButton.classList.remove("disabled");
        }
    }

    private refreshPlayButton(): void {
        const currentOpenedPlaylist: Playlist | null = this.main.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }

        const playButton: HTMLElement = Elements.currentPlaylist.playButton;

        const isMergedContainer: boolean = (currentOpenedPlaylist.mergedPlaylist.length != 0);
        const nbSongs: number = (!isMergedContainer)
            ? currentOpenedPlaylist.songs.length
            : this.main.getMergedContainerSongs(currentOpenedPlaylist, true).length;
            
        if (nbSongs == 0) {
            playButton.classList.add("disabled");
        }
        else {
            playButton.classList.remove("disabled");
        }
    }

    private refreshMainContainer(): void {
        Functions.removeChildren(Elements.currentPlaylist.song.container);
        Functions.removeChildren(Elements.currentPlaylist.merged.container);
        
        const currentOpenedPlaylist: Playlist | null = this.main.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }

        const isMergedContainer: boolean = (currentOpenedPlaylist.mergedPlaylist.length != 0);
        (isMergedContainer)
            ? this.refreshMergedPlaylists(currentOpenedPlaylist)
            : this.refreshPlaylistSongs(currentOpenedPlaylist);

        const sortButtons: HTMLButtonElement[] = Object.values(Elements.currentPlaylist.song.sort).concat(Object.values(Elements.currentPlaylist.merged.sort));
        sortButtons.forEach((buttonElement: HTMLButtonElement) => {
            buttonElement.classList.remove("sorted-by");
            buttonElement.removeAttribute("order");
        });

        const idButton: HTMLButtonElement = (!isMergedContainer) ? Elements.currentPlaylist.song.sort.idButton : Elements.currentPlaylist.merged.sort.idButton;
        idButton.classList.add("sorted-by");
        idButton.setAttribute("order", "asc");
    }

    private static createRowContent(parent: HTMLElement, text: string): HTMLElement {
        const rowElement: HTMLElement = document.createElement("p");
        rowElement.classList.add("text-overflow");
        rowElement.textContent = text;
        parent.appendChild(rowElement);

        return rowElement;
    }

    private refreshPlaylistSongs(currentOpenedPlaylist: Playlist): void {
        Elements.currentPlaylist.container.setAttribute("type", "song-container");

        currentOpenedPlaylist.songs.forEach((song: Song, index: number) => {
            const liElement: HTMLElement = document.createElement("li");
            liElement.setAttribute("playlist-id", String(currentOpenedPlaylist.id));
            liElement.setAttribute("song-id", String(song.id));
            liElement.classList.add("current-playlist-table-row");
            Elements.currentPlaylist.song.container.appendChild(liElement);

            const formatDuration: string = Functions.formatDuration(song.duration);

            const rowElementTexts: string[] = [String(index + 1), song.title, song.artist, formatDuration];
            rowElementTexts.forEach((text: string) => PlaylistsRefreshOpenedManager.createRowContent(liElement, text));

            liElement.addEventListener("click", () => this.app.listenerManager.initQueue(currentOpenedPlaylist, song));
            liElement.addEventListener("contextmenu", (e: PointerEvent) => this.app.contextmenuManager.createSongContextMenu((e as Position), song, liElement));
        });
    }

    private refreshMergedPlaylists(currentOpenedPlaylist: Playlist): void {
        Elements.currentPlaylist.container.setAttribute("type", "merged-container");

        const mergedPlaylists: Playlist[] = currentOpenedPlaylist.mergedPlaylist.map((mergedPlaylist: MergedPlaylist) => {
            return this.main.getPlaylistFromID(mergedPlaylist.id);
        }).filter((playlist: Playlist | null) => playlist != null);

        const sortedMergedPlaylists: Playlist[] = this.main.getSortedPlaylists(mergedPlaylists);

        sortedMergedPlaylists.forEach((playlist: Playlist, index: number) => {

            const mergedPlaylist: MergedPlaylist | undefined = currentOpenedPlaylist.mergedPlaylist.find((mp: MergedPlaylist) => mp.id == playlist.id);
            if (mergedPlaylist == undefined) {
                return this.app.throwError("Can't refresh merged playlist container: Merged playlist is undefined.");
            }

            const toggled: boolean = mergedPlaylist.toggled;

            const liElement: HTMLElement = document.createElement("li");
            liElement.setAttribute("playlist-id", String(playlist.id));
            liElement.classList.add("current-playlist-table-row");
            Elements.currentPlaylist.merged.container.appendChild(liElement);

            PlaylistsRefreshOpenedManager.createRowContent(liElement, String(index + 1));
            const checkboxElementContainer: HTMLElement = PlaylistsRefreshOpenedManager.createRowContent(liElement, "");
            const checkboxElement: HTMLInputElement = document.createElement("input");
            checkboxElement.type = "checkbox";
            if (toggled) {
                checkboxElement.setAttribute("checked", "");
            }
            checkboxElement.setAttribute("tabindex", "-1");
            checkboxElementContainer.appendChild(checkboxElement);

            const thumbnailElementContainer: HTMLElement = PlaylistsRefreshOpenedManager.createRowContent(liElement, "");
            const thumbnailElement: HTMLElement = document.createElement("div");
            Functions.setThumbnail(thumbnailElement, playlist.thumbnailFileName);
            thumbnailElementContainer.appendChild(thumbnailElement);

            const duration: number = playlist.songs.reduce((acc: number, song: Song) => acc + song.duration, 0);
            const formatDuration: string = Functions.formatDuration(duration);

            const rowElementTexts: string[] = [playlist.name, String(playlist.songs.length), formatDuration];
            rowElementTexts.forEach((text: string) => PlaylistsRefreshOpenedManager.createRowContent(liElement, text));

            checkboxElement.addEventListener("change", async () => {
                const chcked: boolean = checkboxElement.checked;

                const updateMergeToggleReqRes: any = await Api.playlist.updateMergeToggle(this.app, playlist.id, chcked);
                if (!updateMergeToggleReqRes.success) {
                    return this.app.throwError(`Can't update merge toggle: ${updateMergeToggleReqRes.error}`);
                }

                await this.main.refreshPlaylistBuffer();
                const updatedCurrentOpenedPlaylist: Playlist | null = (this.main.getPlaylistFromID(currentOpenedPlaylist.id) ?? null);
                this.main.setCurrentOpenedPlaylist(updatedCurrentOpenedPlaylist);

                this.refreshPlayButton();
                this.app.listenerManager.refreshQueue();
            });

            liElement.addEventListener("click", async (e: PointerEvent) => {
                if (e.target == checkboxElement) {
                    return;
                }

                await this.app.playlistManager.open(playlist.id);
            });
            liElement.addEventListener("contextmenu", (e: PointerEvent) => this.app.contextmenuManager.createMergedPlaylistContextMenu((e as Position), playlist, liElement));
        });
    }
};
