import App from "./../../app.js";
import * as Api from "./../../utils/utils.api.js";

async function modalOnConfirm(app: App, playlist: Playlist, mergedPlaylist: Playlist): Promise<ModalError> {
    const removePlaylistFromMergeContainerReqRes: any = await Api.playlist.removeFromMergeContainer(app, playlist.id, mergedPlaylist.id);
    if (!removePlaylistFromMergeContainerReqRes.success) {
        app.throwError(`Can't remove playlist from merge container playlist: ${removePlaylistFromMergeContainerReqRes.error}`, 43);
        return null;
    }

    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();
        app.playlistManager.refreshOpenedPlaylistTab();
    });

    app.modalManager.openTopModal("SUCCESS", `Successfully removed playlist "${mergedPlaylist.name}" from playlist "${playlist.name}".`);
    return null;
}

export default function openRemoveMergedFromPlaylistModal(app: App, playlist: Playlist, mergedPlaylist: Playlist): void {
    const data: CenterModalData = {
        title: `Are you sure you want to remove playlist "${mergedPlaylist.name}" from playlist "${playlist.name}"`,
        onConfirm: async (modal: CenterModal) => await modalOnConfirm(app, playlist, mergedPlaylist),
        cantClose: false,
    };

    app.modalManager.openCenterModal(data);
}
