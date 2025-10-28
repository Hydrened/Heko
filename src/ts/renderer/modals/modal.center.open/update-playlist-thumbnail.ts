import App from "../../app.js";
import CenterModal from "../modal.center.js";
import LoadingModal from "../modal.loading.js";
import * as Requests from "../../utils/utils.requests.js";
import TopModal from "../modal.top.js";

async function updateThumbnailModalOnClick(app: App, modal: CenterModal, currentOpenedPlaylist: Playlist): Promise<ModalError> {
    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        app.throwError("Can't update playlist thumbnail: User is not logged in.");
        return null;
    }

    const removePlaylistThumbnailReqRes: any = await Requests.thumbnail.remove(userData.id, userData.token, currentOpenedPlaylist.id, currentOpenedPlaylist.thumbnailFileName);
    if (!removePlaylistThumbnailReqRes.success) {
        app.throwError(`Can't remove playlist thumbnail: ${removePlaylistThumbnailReqRes.error}`);
        return null;
    }

    const file: File | null = CenterModal.getFileFromFileInput("Thumbnail");
    if (file != null) {
        const uploadPlaylistThumbnailReqRes: any = await LoadingModal.create<any>("Uploading thumbnail", Requests.thumbnail.upload(userData.id, userData.token, file));
        if (!uploadPlaylistThumbnailReqRes.success) {
            app.throwError(`Can't upload playlist thumbnail: ${uploadPlaylistThumbnailReqRes.error}`);
            return null;
        }

        const thumbnailFileName: string = uploadPlaylistThumbnailReqRes.fileName;

        const updatePlaylistThumbnailReqRes: any = await Requests.thumbnail.update(userData.id, userData.token, currentOpenedPlaylist.id, thumbnailFileName);
        if (!updatePlaylistThumbnailReqRes.success) {
            app.throwError(`Can't update playlist thumbnail: ${updatePlaylistThumbnailReqRes.error}`);
            return null;
        }
    }
    
    app.playlistManager.refreshPlaylistsContainerTab();
    app.playlistManager.refreshOpenedPlaylistTab();
    
    TopModal.create("SUCCESS", `Successfully updated "${currentOpenedPlaylist.name}" thumbnail.`);
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

    new CenterModal(app, data);
}
