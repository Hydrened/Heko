import App from "./../../app.js";
import CenterModal from "./../modal.center.js";
import TopModal from "./../modal.top.js";
import * as Requests from "./../../utils/utils.requests.js";

async function removeSongFromPlaylistModalOnConfirm(app: App, playlist: Playlist, song: Song): Promise<ModalError> {
    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        app.throwError("Can't remove song from playlist: User is not logged in.");
        return null;
    }

    const removeSongFromPlaylistReqRes: any = await Requests.song.removeFromPlaylist(userData.id, userData.token, playlist.id, song.id);
    if (!removeSongFromPlaylistReqRes.success) {
        app.throwError(`Can't remove song from playlist: ${removeSongFromPlaylistReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();
        app.playlistManager.refreshOpenedPlaylistTab();
    });

    TopModal.create("SUCCESS", `Successfully removed song "${song.title}" by "${song.artist}" from playlist "${playlist.name}".`);
    return null;
}

export default function openRemoveSongFromPlaylistModal(app: App, playlist: Playlist, song: Song): void {
    const data: CenterModalData = {
        title: `Are you sure you want to remove song "${song.title}" by "${song.artist}" from playlist "${playlist.name}"`,
        onConfirm: async (modal: CenterModal) => await removeSongFromPlaylistModalOnConfirm(app, playlist, song),
        cantClose: false,
    };

    new CenterModal(app, data);
}
