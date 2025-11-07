import App from "./../../app.js";
import * as Requests from "./../../utils/utils.requests.js";

async function updateThumbnailModalOnClick(app: App, modal: CenterModal, currentOpenedPlaylist: Playlist): Promise<ModalError> {
    const removePlaylistThumbnailReqRes: any = await Requests.thumbnail.remove(app, currentOpenedPlaylist.id, currentOpenedPlaylist.thumbnailFileName);
    if (!removePlaylistThumbnailReqRes.success) {
        app.throwError(`Can't remove playlist thumbnail: ${removePlaylistThumbnailReqRes.error}`);
        return null;
    }

    const curentCenterModal: CenterModal | null = app.modalManager.getCurrentCenterModal();
    if (curentCenterModal == null) {
        return {
            error: "Can't confirm modal: Current modal is null.",
        };
    }

    const file: File | null = curentCenterModal.getFileFromFileInput("Thumbnail");
    if (file != null) {
        const uploadPlaylistThumbnailReqRes: any = await app.modalManager.openLoadingModal("Uploading thumbnail", Requests.thumbnail.upload(app, file));
        if (!uploadPlaylistThumbnailReqRes.success) {
            app.throwError(`Can't upload playlist thumbnail: ${uploadPlaylistThumbnailReqRes.error}`);
            return null;
        }

        const thumbnailFileName: string = uploadPlaylistThumbnailReqRes.fileName;

        const updatePlaylistThumbnailReqRes: any = await Requests.thumbnail.update(app, currentOpenedPlaylist.id, thumbnailFileName);
        if (!updatePlaylistThumbnailReqRes.success) {
            app.throwError(`Can't update playlist thumbnail: ${updatePlaylistThumbnailReqRes.error}`);
            return null;
        }
    }
    
    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();
        app.playlistManager.refreshOpenedPlaylistTab();
    });
    
    app.modalManager.openTopModal("SUCCESS", `Successfully updated "${currentOpenedPlaylist.name}" thumbnail.`);
    return null;
}

export default function openUpdateThumbnailModal(app: App): void {
    const currentOpenedPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentOpenedPlaylist == null) {
        return app.throwError("Can't open update thumbnail modal: Current opened playlist is null.");
    }

    const content: ModalRow[] = [
        { label: "Thumbnail", type: "FILE" },
    ];

    const data: CenterModalData = {
        title: `Set ${currentOpenedPlaylist.name}'s thumbnail`,
        content: content,
        onConfirm: async (modal: CenterModal) => await updateThumbnailModalOnClick(app, modal, currentOpenedPlaylist),
        cantClose: false,
    };

    app.modalManager.openCenterModal(data);
}
