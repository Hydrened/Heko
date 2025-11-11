import App from "./../app.js";
import PlaylistManager from "./playlists.js";
import openUpdateThumbnailModal from "./../modals/modal.center.open/update-playlist-thumbnail.js";
import openCreatePlaylistModal from "./../modals/modal.center.open/create-playlist.js";
import openAddSongToPlaylistModal from "./../modals/modal.center.open/add-song-to-playlist.js";
import { getPlaylistRowShortcuts, getPlaylistRows } from "./../contextmenus/contextmenu.rows/playlist.js";
import { getPlaylistContainerShortcuts, getPlaylistContainerRows } from "./../contextmenus/contextmenu.rows/playlist-container.js";
import { getSongContainerShortcuts, getSongContainerRows } from "./../contextmenus/contextmenu.rows/song-container.js";
import { getMergedContainerShortcuts, getMergedContainerRows } from "../contextmenus/contextmenu.rows/merged-container.js";
import * as Functions from "./../utils/utils.functions.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistsEventManager {
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
            openAddSongToPlaylistModal(this.app, this.main.getPlaylistSongsLeft());
        });
    }

    private initOpenedPlaylistEvents(): void {
        Elements.currentPlaylist.details.thumbnail.addEventListener("click", () => openUpdateThumbnailModal(this.app));

        const input: HTMLInputElement = Elements.currentPlaylist.songFilterInput;

        input.addEventListener("input", () => this.openedPlaylistInputFilterOnInput());
        input.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key == "Escape") {
                input.blur();
                input.value = "";
                input.dispatchEvent(new Event("input"));
            }
        });

        (Elements.currentPlaylist.song.container as HTMLElement).addEventListener("contextmenu", async (e: PointerEvent) => this.openedPlaylistSongContainerOnContextmenu(e));
        (Elements.currentPlaylist.merged.container as HTMLElement).addEventListener("contextmenu", async (e: PointerEvent) => this.openedPlaylistMergedContainerOnContextmenu(e));

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
        const currentOpenedPlaylist: Playlist | null = this.main.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }

        const value: string = Elements.currentPlaylist.songFilterInput.value.toLowerCase();

        const isMergeContainer: boolean = (currentOpenedPlaylist.mergedPlaylist.length != 0);
        (isMergeContainer)
            ? this.openedPlaylistInputFilterMergedOnInput(currentOpenedPlaylist, value)
            : this.openedPlaylistInputFilterSongOnInput(currentOpenedPlaylist, value);
    }

    private openedPlaylistInputFilterMergedOnInput(currentOpenedPlaylist: Playlist, value: string): void {
        currentOpenedPlaylist.mergedPlaylist.forEach((mergedPlaylist: MergedPlaylist) => {
            const playlist: Playlist | undefined = this.main.getPlaylistFromID(mergedPlaylist.id);
            if (playlist == undefined) {
                return this.app.throwError("Can't filter merged playlists: A merged playlist is undefined.");
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

            const nameIncludes: boolean = playlist.name.toLowerCase().includes(value);

            const songIncludes: boolean = playlist.songs.some((song: Song) => {
                const titleIncludes: boolean = song.title.toLowerCase().includes(value);
                const artistIncludes: boolean = song.artist.toLowerCase().includes(value);

                return (titleIncludes || artistIncludes);
            });

            if (nameIncludes || songIncludes) {
                liElement.classList.remove("hidden");
            }
            else {
                liElement.classList.add("hidden");
            }
        });
    }

    private openedPlaylistInputFilterSongOnInput(currentOpenedPlaylist: Playlist, value: string): void {
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

            const titleIncludes: boolean = song.title.toLowerCase().includes(value);
            const artistIncludes: boolean = song.artist.toLowerCase().includes(value);

            if (titleIncludes || artistIncludes) {
                liElement.classList.remove("hidden");
            }
            else {
                liElement.classList.add("hidden");
            }
        });
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
