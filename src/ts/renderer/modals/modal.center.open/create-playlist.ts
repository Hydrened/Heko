import App from "./../../app.js";
import * as Requests from "./../../utils/utils.requests.js";
import * as Functions from "./../../utils/utils.functions.js";

async function createPlaylistOnConfirm(app: App, modal: CenterModal): Promise<ModalError> {
    const newPlaylistName: string = modal.getFieldValue("Name");
    if (newPlaylistName.length < 3) {
        return {
            fieldName: "Name",
            error: "Name has to be at least 3 characters long.",
        };
    }

    const currentCenterModal: CenterModal | null = app.modalManager.getCurrentCenterModal();
    if (currentCenterModal == null) {
        return {
            error: "Can't confirm modal: Current modal is null.",
        };
    }
    
    const file: File | null = currentCenterModal.getFileFromFileInput("Thumbnail");
    if (file != null) {
        if (!file.type.includes("image/")) {
            return {
                fieldName: "Thumbnail",
                error: "File format is not supported.",
            };
        }

        const fileSize: number = Functions.getFileSize(file);
        if (fileSize > 10) {
            return {
                fieldName: "Thumbnail",
                error: "File is too large (max 10 mo).",
            };
        }
    }

    const playlistNames: string[] = app.playlistManager.getPlaylistBuffer().map((playlist: Playlist) => playlist.name);
    const playlistNameAlreadyExists: boolean = playlistNames.includes(newPlaylistName);
    
    if (playlistNameAlreadyExists) {
        return {
            fieldName: "Name",
            error: `Playlist with name "${newPlaylistName}" already exists.`,
        };
    }

    let thumbnailFileName: string = "";
    if (file != null) {
        const uploadPlaylistThumbnailReqRes: any = await app.modalManager.openLoadingModal("Uploading thumbnail", Requests.thumbnail.upload(app, file));
        if (!uploadPlaylistThumbnailReqRes.success) {
            app.throwError(`Can't uplaod playlist thumbnail: ${uploadPlaylistThumbnailReqRes.error}`);
            return null;
        }

        thumbnailFileName = uploadPlaylistThumbnailReqRes.fileName;
    }

    const addPlaylistReqRes: any = await Requests.playlist.add(app, newPlaylistName, thumbnailFileName);
    if (!addPlaylistReqRes.success) {
        app.throwError(`Can't add playlist: ${addPlaylistReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();

        const newPlaylistID: number = (addPlaylistReqRes.playlistID as number);
        app.playlistManager.open(newPlaylistID);
    });

    app.modalManager.openTopModal("SUCCESS", `Successfully created playlist "${newPlaylistName}".`);
    return null;
}

export default function openCreatePlaylistModal(app: App): void {
    const content: ModalRow[] = [
        { label: "Name", type: "TEXT", maxLength: 150 },
        { label: "Thumbnail", type: "FILE", data: ["image/png", "image/jpeg", "image/gif", "image/webp"] },
    ];

    const data: CenterModalData = {
        title: "Create a playlist",
        content: content,
        onConfirm: (modal: CenterModal): Promise<ModalError> => createPlaylistOnConfirm(app, modal),
        cantClose: false,
    };

    app.modalManager.openCenterModal(data);
}
