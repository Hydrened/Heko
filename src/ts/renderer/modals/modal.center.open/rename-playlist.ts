import App from "./../../app.js";
import CenterModal from "./../modal.center.js";
import TopModal from "./../modal.top.js";
import * as Requests from "./../../utils/utils.requests.js";

async function renamePlaylistModalOnConfirm(app: App, playlist: Playlist, modal: CenterModal): Promise<ModalError> {
    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        app.throwError("Can't rename playlist: User is not logged in.");
        return null;
    }

    const newPlaylistName: string = modal.getFieldValue("New name");

    const renamePlaylistReqRes: any = await Requests.playlist.rename(userData.id, userData.token, playlist.id, newPlaylistName);
    if (!renamePlaylistReqRes.success) {
        app.throwError(`Can't rename playlist: ${renamePlaylistReqRes.error}`);
        return null;
    }
    
    app.playlistManager.refreshPlaylistsContainerTab();
    if (app.playlistManager.getCurrentOpenedPlaylist()?.id == playlist.id) {
        app.playlistManager.refreshOpenedPlaylistTab();
    }

    TopModal.create("SUCCESS", `Successfully renamed playlist "${playlist.name}" to "${newPlaylistName}".`);
    return null;
}

export default function openRenamePlaylistModal(app: App, playlist: Playlist): void {
    const content: ModalRow[] = [
        { label: "New name", type: "TEXT", defaultValue: playlist.name, maxLength: 150 },
    ];

    const data: CenterModalData = {
        title: `Rename playlist "${playlist.name}".`,
        content: content,
        onConfirm: async (modal: CenterModal) => await renamePlaylistModalOnConfirm(app, playlist, modal),
        cantClose: false,
    };

    new CenterModal(app, data);
}
