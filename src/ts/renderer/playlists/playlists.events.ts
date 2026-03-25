import App from "./../app.js";
import PlaylistManager from "./playlists.js";
import openUpdateThumbnailModal from "./../modals/modal.center.open/update-playlist-thumbnail.js";
import openCreatePlaylistModal from "./../modals/modal.center.open/create-playlist.js";
import openAddSongsToPlaylistModal from "./../modals/modal.center.open/add-songs-to-playlist.js";
import { getPlaylistRowShortcuts, getPlaylistRows } from "./../contextmenus/contextmenu.rows/playlist.js";
import { getPlaylistContainerShortcuts, getPlaylistContainerRows } from "./../contextmenus/contextmenu.rows/playlist-container.js";
import { getSongContainerShortcuts, getSongContainerRows } from "./../contextmenus/contextmenu.rows/song-container.js";
import { getMergedContainerShortcuts, getMergedContainerRows } from "../contextmenus/contextmenu.rows/merged-container.js";
import * as Functions from "./../utils/utils.functions.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistsEventManager {
    private searchTimeout: NodeJS.Timeout | null = null;

    constructor(private app: App, private main: PlaylistManager) {
        this.initContextmenuShortcuts();
        this.initPlaylistContainerEvents();
        this.initOpenedPlaylistEvents();
    }

    private initContextmenuShortcuts(): void {
        let prevent: boolean = false;

        document.addEventListener("keydown", (e: KeyboardEvent) => {
            if (prevent) {
                return;
            }

            prevent = true;

            this.playlistContrainerShortcuts(e);
            this.openedPlaylistShortcuts(e);

            prevent = false;
        });
    }

    private initPlaylistContainerEvents(): void {
        Elements.playlists.addButton.addEventListener("click", () => openCreatePlaylistModal(this.app));

        (Elements.playlists.container as HTMLElement).addEventListener("contextmenu", (e: PointerEvent) => {
            if (e.target != Elements.playlists.container) {
                return;
            }

            this.app.contextmenuManager.createPlaylistContainerContextmenu((e as Position));
        });

        Elements.songs.settingsButton.addEventListener("click", () => {
            const rect: DOMRect = Elements.songs.settingsButton.getBoundingClientRect();
            this.app.contextmenuManager.createSongSettingContextMenu({ x: rect.x + rect.width, y: rect.y });
        });

        Elements.currentPlaylist.addSongsButton.addEventListener("click", () => {
            openAddSongsToPlaylistModal(this.app, this.main.getPlaylistSongsLeft());
        });
    }

    private initOpenedPlaylistEvents(): void {
        Elements.currentPlaylist.details.thumbnail.addEventListener("click", () => openUpdateThumbnailModal(this.app));

        const playButton: HTMLElement = Elements.currentPlaylist.playButton;

        playButton.addEventListener("click", () => {
            const currentOpenedPlaylist: Playlist | null = this.main.getCurrentOpenedPlaylist();
            if (currentOpenedPlaylist == null) {
                return;
            }

            this.app.listenerManager.initQueue(currentOpenedPlaylist, null);
        });

        const input: HTMLInputElement = Elements.currentPlaylist.songFilterInput;

        input.addEventListener("input", () => this.openedPlaylistInputFilterOnInput());
        input.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key == "Escape") {
                input.blur();
                input.value = "";
                input.dispatchEvent(new Event("input"));
            }
        });

        const sortButtons: HTMLButtonElement[] = Object.values(Elements.currentPlaylist.song.sort).concat(Object.values(Elements.currentPlaylist.merged.sort));
        sortButtons.forEach((buttonElement: HTMLButtonElement) => {
            buttonElement.addEventListener("click", () => this.openedPlaylistSortOnClick(buttonElement));
        });

        Elements.currentPlaylist.song.container.addEventListener("contextmenu", async (e: PointerEvent) => this.openedPlaylistSongContainerOnContextmenu(e));
        Elements.currentPlaylist.merged.container.addEventListener("contextmenu", async (e: PointerEvent) => this.openedPlaylistMergedContainerOnContextmenu(e));
    }

    // PLAYLIST CONTAINER EVENTS
    private playlistContrainerShortcuts(e: KeyboardEvent): void {
        if (Functions.isCenterModalAlreadyOpened() || this.app.settings.areOpened()) {
            return;
        }

        Functions.testShortcuts(e, getPlaylistContainerShortcuts(), getPlaylistContainerRows, this.app);
    }

    // OPENED PLAYLIST EVENTS
    private openedPlaylistShortcuts(e: KeyboardEvent): void {
        if (Functions.isCenterModalAlreadyOpened() || this.app.settings.areOpened()) {
            return;
        }

        const currentOpenedPlaylist: Playlist | null = this.main.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }
        Functions.testShortcuts(e, getPlaylistRowShortcuts(), getPlaylistRows, this.app, currentOpenedPlaylist);

        if (currentOpenedPlaylist.mergedPlaylist.length != 0) {
            Functions.testShortcuts(e, getMergedContainerShortcuts(), getMergedContainerRows, this.app, currentOpenedPlaylist);
        }
        else {
            Functions.testShortcuts(e, getSongContainerShortcuts(), getSongContainerRows, this.app);
        }
    }

    private openedPlaylistInputFilterOnInput(): void {
        if (this.searchTimeout != null) {
            clearTimeout(this.searchTimeout);
        }

        this.searchTimeout = setTimeout(() => {
            this.searchTimeout = null;
            
            const currentOpenedPlaylist: Playlist | null = this.main.getCurrentOpenedPlaylist();
            if (currentOpenedPlaylist == null) {
                return;
            }

            const values: string[] = Elements.currentPlaylist.songFilterInput.value.toLowerCase().split(" ").filter((v: string) => (v != ""));

            const isMergeContainer: boolean = (currentOpenedPlaylist.mergedPlaylist.length != 0);
            (isMergeContainer)
                ? this.openedPlaylistInputFilterMergedOnInput(currentOpenedPlaylist, values)
                : this.openedPlaylistInputFilterSongOnInput(currentOpenedPlaylist, values);
        }, 300);
    }

    private openedPlaylistInputFilterMergedOnInput(currentOpenedPlaylist: Playlist, values: string[]): void {
        currentOpenedPlaylist.mergedPlaylist.forEach((mergedPlaylist: MergedPlaylist) => {
            const playlist: Playlist | null = this.main.getPlaylistFromID(mergedPlaylist.id);
            if (playlist == null) {
                return this.app.throwError("Can't filter merged playlists: A merged playlist is null.");
            }

            const liElement: Element | undefined = [...Elements.currentPlaylist.merged.container.children].find((li: Element) => {
                if (!li.hasAttribute("playlist-id")) {
                    return false;
                }

                const playlistID: number = Number(li.getAttribute("playlist-id"));
                return (playlistID == mergedPlaylist.id);
            });

            if (liElement == undefined) {
                return;
            }

            const songStrings: string[] = playlist.songs.reduce((acc: string[], song: Song) => {
                const songStrings: string[] = [song.title.toLowerCase(), song.artist.toLowerCase()];
                return acc.concat(songStrings);
            }, []);
            
            const filter: string[] = [playlist.name.toLowerCase()].concat(songStrings)
                .map((str: string) => str.split(" "))
                .reduce((acc: string[], arr: string[]) => acc.concat(arr), []);

            const includes: boolean = values.every((value: string) => filter.some((filterWord: string) => filterWord.includes(value)));
            if (includes) {
                liElement.classList.remove("hidden");
            }
            else {
                liElement.classList.add("hidden");
            }
        });
    }

    private openedPlaylistInputFilterSongOnInput(currentOpenedPlaylist: Playlist, values: string[]): void {
        currentOpenedPlaylist.songs.forEach((song: Song) => {
            const liElement: Element | undefined = [...Elements.currentPlaylist.song.container.children].find((li: Element) => {
                if (!li.hasAttribute("song-id")) {
                    return false;
                }

                const songID: number = Number(li.getAttribute("song-id"));
                return (songID == song.id);
            });

            if (liElement == undefined) {
                return;
            }

            const filter: string[] = [song.title.toLowerCase(), song.artist.toLowerCase()]
                .map((str: string) => str.split(" "))
                .reduce((acc: string[], arr: string[]) => acc.concat(arr), []);

            const includes: boolean = values.every((value: string) => filter.some((filterWord: string) => filterWord.includes(value)));
            if (includes) {
                liElement.classList.remove("hidden");
            }
            else {
                liElement.classList.add("hidden");
            }
        });
    }

    private openedPlaylistSortOnClick(buttonElement: HTMLButtonElement): void {
        this.main.sortOpenedPlaylist(buttonElement);
    }

    private openedPlaylistSongContainerOnContextmenu(e: PointerEvent): void {
        if (e.target != Elements.currentPlaylist.song.container) {
            return;
        }

        this.app.contextmenuManager.createSongContainerContextMenu((e as Position));
    }

    private openedPlaylistMergedContainerOnContextmenu(e: PointerEvent): void {
        const currentOpenedPlaylist: Playlist | null = this.main.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }

        if (e.target != Elements.currentPlaylist.merged.container) {
            return;
        }

        this.app.contextmenuManager.createMergedContainerContextmenu((e as Position), currentOpenedPlaylist);
    }
};
