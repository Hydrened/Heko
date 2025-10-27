import PlaylistManager from "./playlists.js";
import App from "./../app.js";
import CenterModal from "./../modals/modal.center.js";
import { getCreatePlaylistModalData } from "./../contextmenus/contextmenu.playlist-container.js";
import { getAddSongModalData, getSongsLeft } from "../contextmenus/contextmenu.song-container.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistsEventManager {
    constructor(private app: App, private playlists: PlaylistManager) {
        this.initPlaylistContainerEvents();
        this.initOpenedPlaylistEvents();
    }

    private initPlaylistContainerEvents(): void {
        Elements.playlists.addButton!.addEventListener("click", () => {
            new CenterModal(this.app, getCreatePlaylistModalData(this.app));
        });

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
        // Elements.currentPlaylist.details.thumbnail!.addEventListener("click", () => {
        //     const data: CenterModalData = {
        //         title: "",
        //         content: [
        //             { label: "", type: "FILE" },
        //         ],
        //         onConfirm: () => {},
        //         cantClose: false,
        //     };

        //     new CenterModal(this.app, data);
        // });

        Elements.currentPlaylist.songFilterInput!.addEventListener("input", () => {
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
        });

        (Elements.currentPlaylist.songContainer as HTMLElement).addEventListener("contextmenu", async (e: PointerEvent) => {
            if (e.target != Elements.currentPlaylist.songContainer) {
                return;
            }

            const currentOpenedPlaylist: Playlist | null = this.playlists.getCurrentOpenedPlaylist();
            if (currentOpenedPlaylist == null) {
                return;
            }

            this.app.contextmenuManager.createSongContainerContextMenu((e as Position), currentOpenedPlaylist);
        });

        Elements.currentPlaylist.addSongsButton!.addEventListener("click", async () => {
            const currentOpenedPlaylist: Playlist | null = this.playlists.getCurrentOpenedPlaylist();
            if (currentOpenedPlaylist == null) {
                return;
            }

            const userData: UserData = this.app.account.getUserData();
            if (userData.id == null || userData.token == null) {
                this.app.throwError("Can't open add song to playlist modal: User is not logged in.");
                return [];
            }

            const songsLeft: Song[] = await getSongsLeft(this.app, userData.id, userData.token, currentOpenedPlaylist);
            new CenterModal(this.app, getAddSongModalData(this.app, userData.id, userData.token, currentOpenedPlaylist, songsLeft));
        });
    }
};
