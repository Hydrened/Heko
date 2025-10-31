import App from "./../app.js";
import PlaylistManager from "./playlists.js";
import openUpdateThumbnailModal from "./../modals/modal.center.open/update-playlist-thumbnail.js";
import openCreatePlaylistModal from "./../modals/modal.center.open/create-playlist.js";
import openAddSongToPlaylistModal from "./../modals/modal.center.open/add-song-to-playlist.js";
import { getPlaylistRows, getPlaylistRowShortcuts } from "./../contextmenus/contextmenu.rows/playlist.js";
import { getPlaylistContainerRows, getPlaylistContainerShortcuts } from "./../contextmenus/contextmenu.rows/playlist-container.js";
import { getSongContainerShortcuts, getSongContainerRows } from "./../contextmenus/contextmenu.rows/song-container.js";
import * as Functions from "./../utils/utils.functions.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistsEventManager {
    constructor(private app: App, private playlists: PlaylistManager) {
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
            openAddSongToPlaylistModal(this.app, this.playlists.getSongsLeft());
        });
    }

    private initOpenedPlaylistEvents(): void {
        Elements.currentPlaylist.details.thumbnail.addEventListener("click", () => openUpdateThumbnailModal(this.app));

        const input: HTMLInputElement = (Elements.currentPlaylist.songFilterInput as HTMLInputElement);

        input.addEventListener("input", () => this.openedPlaylistInputFilterOnInput());
        input.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key == "Escape") {
                input.blur();
                input.value = "";
                input.dispatchEvent(new Event("input"));
            }
        });

        (Elements.currentPlaylist.songContainer as HTMLElement).addEventListener("contextmenu", async (e: PointerEvent) => this.openedPlaylistSongContainerOnContextmenu(e));

    }

    // PLAYLIST CONTAINER EVENTS
    private playlistContrainerShortcuts(e: KeyboardEvent): void {
        if (Functions.isCenterModalAlreadyOpened()) {
            return;
        }

        Functions.testShortcuts(e, getPlaylistContainerShortcuts(), getPlaylistContainerRows, this.app);
    }

    // OPENED PLAYLIST EVENTS
    private openedPlaylistShortcuts(e: KeyboardEvent): void {
        if (Functions.isCenterModalAlreadyOpened()) {
            return;
        }

        const currentOpenedPlaylist: Playlist | null = this.playlists.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }

        Functions.testShortcuts(e, getPlaylistRowShortcuts(), getPlaylistRows, this.app, currentOpenedPlaylist);
        Functions.testShortcuts(e, getSongContainerShortcuts(), getSongContainerRows, this.app);
    }

    private openedPlaylistInputFilterOnInput(): void {
        const value: string = (Elements.currentPlaylist.songFilterInput as HTMLInputElement).value.toLowerCase();

        const currentOpenedPlaylistSongs: Song[] = this.playlists.getCurrentOpenedPlaylistSongs();
        currentOpenedPlaylistSongs.forEach((song: Song) => {
            const titleIncludes: boolean = song.title.toLowerCase().includes(value);
            const artistIncludes: boolean = song.artist.toLowerCase().includes(value);

            const liElement: Element | undefined = [...Elements.currentPlaylist.songContainer.children].find((li: Element) => {
                if (!li.hasAttribute("song-id")) {
                    return false;
                }

                const songID: number = Number(li.getAttribute("song-id"));
                return (songID == song.id);
            });

            if (liElement == undefined) {
                return false;
            }

            if (titleIncludes || artistIncludes) {
                liElement.classList.remove("hidden");
            }
            else {
                liElement.classList.add("hidden");
            }
        });
    }

    private openedPlaylistSongContainerOnContextmenu(e: PointerEvent): void {
        if (e.target != Elements.currentPlaylist.songContainer) {
            return;
        }

        this.app.contextmenuManager.createSongContainerContextMenu((e as Position));
    }
};
