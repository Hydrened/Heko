import App from "./../../app.js";
import openEditSongFromPlaylistModal from "./../../modals/modal.center.open/edit-song-from-playlist.js";
import openRemoveSongFromPlaylistModal from "./../../modals/modal.center.open/remove-song-from-playlist.js";
import * as Requests from "./../../utils/utils.requests.js";

async function addSongToPlaylistOnClick(app: App, playlist: Playlist, song: Song): Promise<void> {
    const addSongToPlaylistReqRes: any = await Requests.song.addToPlaylist(app, song.id, playlist.id);
    if (!addSongToPlaylistReqRes.success) {
        return app.throwError(`Can't add song to playlist: ${addSongToPlaylistReqRes.error}`);
    }

    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();
    });

    app.modalManager.openTopModal("SUCCESS", `Successfully added song "${song.title}" by "${song.artist}" to playlist "${playlist.name}".`);
}

export function getSongRows(app: App, song: Song): ContextmenuRow[] {
    const errorBase: string = "Can't get song contextmenu rows";

    const currentOpenedPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentOpenedPlaylist == null) {
        app.throwError(`${errorBase}: Current opened playlist is null.`);
        return [];
    }

    const addToOtherPlaylistRows: ContextmenuRow[] = [];
    for (const playlist of app.playlistManager.getPlaylistWhereSongIsNotIn(song.id)) {
        if (playlist.children != 0) {
            continue;
        }

        if (playlist.mergedPlaylist.length != 0) {
            continue;
        }

        addToOtherPlaylistRows.push({
            title: playlist.name,
            onClick: async () => await addSongToPlaylistOnClick(app, playlist, song),
            disabled: false,
        });
    }

    const disableAddToQueue: boolean = (app.listenerManager.getCurrentListeningPlaylist() == null);
    const disableAddToOtherPlaylist: boolean = (addToOtherPlaylistRows.length == 0);

    return [
        { title: "Add to queue", onClick: async () => {
            app.listenerManager.addSongToQueue(song);
            app.modalManager.openTopModal("SUCCESS", `Successfully added song "${song.title}" by "${song.artist}" to queue.`);
        }, disabled: disableAddToQueue },

        { title: "Add to other playlist", rows: addToOtherPlaylistRows, disabled: disableAddToOtherPlaylist },

        { title: "Remove from playlist", onClick: async () => {
            openRemoveSongFromPlaylistModal(app, currentOpenedPlaylist, song);
        }, disabled: false },

        { title: "Edit song", onClick: async () => {
            openEditSongFromPlaylistModal(app, song);
        }, disabled: false },
    ];
}
