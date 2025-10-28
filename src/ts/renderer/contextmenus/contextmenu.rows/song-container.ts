import App from "./../../app.js";
import openAddSongToPlaylistModal from "./../../modals/modal.center.open/add-song-to-playlist.js";

export async function getSongContainerRows(app: App, openedPlaylist: Playlist): Promise<ContextmenuRow[]> {
    const songsLeft: Song[] = await app.playlistManager.getSongsLeft();
    const disableAddSong: boolean = (songsLeft.length == 0);

    return [
        { title: "Add song", shortcut: { ctrl: true, shift: false, alt: false, key: "N" }, onClick: async () => {
            openAddSongToPlaylistModal(app, songsLeft);
        }, disabled: disableAddSong },
    ];
}
