import App from "./../../app.js";
import * as Requests from "./../../utils/utils.requests.js";

async function removeMergedFromPlaylistModalOnConfirm(app: App, playlist: Playlist, mergedPlaylist: Playlist): Promise<ModalError> {
    const removePlaylistFromMergeContainerReqRes: any = await Requests.playlist.removeFromMergeContainer(app, playlist.id, mergedPlaylist.id);
    if (!removePlaylistFromMergeContainerReqRes.success) {
        app.throwError(`Can't remove playlist from merge container playlist: ${removePlaylistFromMergeContainerReqRes.error}`);
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
        onConfirm: async (modal: CenterModal) => await removeMergedFromPlaylistModalOnConfirm(app, playlist, mergedPlaylist),
        cantClose: false,
    };

    app.modalManager.openCenterModal(data);
}
