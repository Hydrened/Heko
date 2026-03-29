import App from "./../../app.js";
import openEditSongFromPlaylistModal from "./../../modals/modal.center.open/edit-song-from-playlist.js";
import openRemoveSongFromPlaylistModal from "./../../modals/modal.center.open/remove-song-from-playlist.js";
import openAddSongToPlaylistsModal from "./../../modals/modal.center.open/add-song-to-playlistys.js";

export function getSongRows(app: App, song: Song): ContextmenuRow[] {
    const errorBase: string = "Can't get song contextmenu rows";

    const currentOpenedPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentOpenedPlaylist == null) {
        app.throwError(`${errorBase}: Current opened playlist is null.`, 8);
        return [];
    }

    const playlistsLeft: Playlist[] = app.playlistManager.getPlaylistWhereSongIsNotIn(song.id);

    const disableAddToQueue: boolean = (app.listenerManager.getCurrentListeningPlaylist() == null);
    const disableAddToOtherPlaylist: boolean = (playlistsLeft.length == 0);
    const disableRemoveFromPlaylist: boolean = !currentOpenedPlaylist.songs.some((s: Song) => s.id == song.id);

    return [
        { title: "Add to queue", onClick: async () => {
            app.listenerManager.addSongToQueue(song);
            app.modalManager.openTopModal("SUCCESS", `Successfully added song "${song.title}" by "${song.artist}" to queue.`);
        }, disabled: disableAddToQueue },

        { title: "Add to other playlist", onClick: async () => {
            openAddSongToPlaylistsModal(app, playlistsLeft, song);
        }, disabled: disableAddToOtherPlaylist },

        { title: "Remove from playlist", onClick: async () => {
            openRemoveSongFromPlaylistModal(app, currentOpenedPlaylist, song);
        }, disabled: disableRemoveFromPlaylist },

        { title: "Edit song", onClick: async () => {
            openEditSongFromPlaylistModal(app, song);
        }, disabled: false },
    ];
}
