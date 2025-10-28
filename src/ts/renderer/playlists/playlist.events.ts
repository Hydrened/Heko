import App from "./../app.js";
import PlaylistManager from "./playlists.js";
import openUpdateThumbnailModal from "./../modals/modal.center.open/update-playlist-thumbnail.js";
import openCreatePlaylistModal from "./../modals/modal.center.open/create-playlist.js";
import openAddSongToPlaylistModal from "./../modals/modal.center.open/add-song-to-playlist.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistsEventManager {
    constructor(private app: App, private playlists: PlaylistManager) {
        this.initPlaylistContainerEvents();
        this.initOpenedPlaylistEvents();
    }

    private initPlaylistContainerEvents(): void {
        Elements.playlists.addButton!.addEventListener("click", () => openCreatePlaylistModal(this.app));

        (Elements.playlists.container as HTMLElement).addEventListener("contextmenu", (e: PointerEvent) => {
            if (e.target != Elements.playlists.container) {
                return;
            }

            this.app.contextmenuManager.createPlaylistContainerContextmenu((e as Position));
        });

        Elements.songs.settingsButton!.addEventListener("click", async () => {
            const rect: DOMRect = Elements.songs.settingsButton!.getBoundingClientRect();
            await this.app.contextmenuManager.createSongSettingContextMenu({ x: rect.x + rect.width, y: rect.y });
        });
    }

    private initOpenedPlaylistEvents(): void {
        Elements.currentPlaylist.details.thumbnail!.addEventListener("click", () => openUpdateThumbnailModal(this.app));

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

        Elements.currentPlaylist.addSongsButton!.addEventListener("click", async () => {
            const songsLeft: Song[] = await this.playlists.getSongsLeft();
            openAddSongToPlaylistModal(this.app, songsLeft);
        });
    }

    // OPENED PLAYLIST EVENTS
    private openedPlaylistInputFilterOnInput(): void {
        const value: string = (Elements.currentPlaylist.songFilterInput as HTMLInputElement).value.toLowerCase();

        const currentOpenedPlaylistSongs: Song[] = this.playlists.getCurrentOpenedPlaylistSongs();
        currentOpenedPlaylistSongs.forEach((song: Song) => {
            const titleIncludes: boolean = song.title.toLowerCase().includes(value);
            const artistIncludes: boolean = song.artist.toLowerCase().includes(value);

            const liElement: Element | undefined = [...Elements.currentPlaylist.songContainer!.children].find((li: Element) => {
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

        const currentOpenedPlaylist: Playlist | null = this.playlists.getCurrentOpenedPlaylist();
        if (currentOpenedPlaylist == null) {
            return;
        }

        this.app.contextmenuManager.createSongContainerContextMenu((e as Position), currentOpenedPlaylist);
    }
};
