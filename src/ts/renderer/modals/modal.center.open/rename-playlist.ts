import App from "./../../app.js";
import * as Requests from "./../../utils/utils.requests.js";

async function renamePlaylistModalOnConfirm(app: App, playlist: Playlist, modal: CenterModal): Promise<ModalError> {
    const newPlaylistName: string = modal.getFieldValue("New name");

    if (newPlaylistName.length < 3) {
        return {
            error: "Playlist anme has to be at least 3 characters long.",
            fieldName: "New name",
        };
    }

    const playlistNames: string[] = app.playlistManager.getPlaylistBuffer().map((p: Playlist) => p.name);
    if (playlistNames.includes(newPlaylistName)) {
        return {
            error: `Playlist named "${newPlaylistName}" already exists.`,
            fieldName: "New name",
        };
    }

    const renamePlaylistReqRes: any = await Requests.playlist.rename(app, playlist.id, newPlaylistName);
    if (!renamePlaylistReqRes.success) {
        app.throwError(`Can't rename playlist: ${renamePlaylistReqRes.error}`);
        return null;
    }
    
    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();
        
        if (app.playlistManager.getCurrentOpenedPlaylist()?.id == playlist.id) {
            app.playlistManager.refreshOpenedPlaylistTab();
        }
    });

    app.modalManager.openTopModal("SUCCESS", `Successfully renamed playlist "${playlist.name}" to "${newPlaylistName}".`);
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

    app.modalManager.openCenterModal(data);
}
