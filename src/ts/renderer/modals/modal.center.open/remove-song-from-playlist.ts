import App from "./../../app.js";
import * as Api from "./../../utils/utils.api.js";

async function modalOnConfirm(app: App, playlist: Playlist, song: Song): Promise<ModalError> {
    const removeSongFromPlaylistReqRes: any = await Api.song.removeFromPlaylist(app, playlist.id, song.id);
    if (!removeSongFromPlaylistReqRes.success) {
        app.throwError(`Can't remove song from playlist: ${removeSongFromPlaylistReqRes.error}`, 45);
        return null;
    }

    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();
        app.playlistManager.refreshOpenedPlaylistTab();
        app.listenerManager.refresh();
    });

    app.modalManager.openTopModal("SUCCESS", `Successfully removed song "${song.title}" by "${song.artist}" from playlist "${playlist.name}".`);
    return null;
}

export default function openRemoveSongFromPlaylistModal(app: App, playlist: Playlist, song: Song): void {
    const data: CenterModalData = {
        title: `Are you sure you want to remove song "${song.title}" by "${song.artist}" from playlist "${playlist.name}"`,
        onConfirm: async (modal: CenterModal) => await modalOnConfirm(app, playlist, song),
        cantClose: false,
    };

    app.modalManager.openCenterModal(data);
}
