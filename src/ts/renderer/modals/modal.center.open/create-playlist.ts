import App from "./../../app.js";
import CenterModal from "./../modal.center.js";
import LoadingModal from "./../modal.loading.js";
import TopModal from "./../modal.top.js";
import * as Requests from "./../../utils/utils.requests.js";

async function createPlaylistOnConfirm(app: App, modal: CenterModal): Promise<ModalError> {
    const newPlaylistName: string = modal.getFieldValue("Name");
    if (newPlaylistName.length < 3) {
        return {
            fieldName: "Name",
            error: "Name has to be at least 3 characters long.",
        };
    }
    
    const file: File | null = CenterModal.getFileFromFileInput("Thumbnail");
    if (file != null) {
        if (!file.type.includes("image/")) {
            return {
                fieldName: "Thumbnail",
                error: "File format is not supported.",
            };
        }

        const fileSize: number = CenterModal.getFileSize(file);
        if (fileSize > 10) {
            return {
                fieldName: "Thumbnail",
                error: "File is too large (max 10 mo).",
            };
        }
    }

    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        return {
            error: "User is not logged in.",
        };
    }

    const getAllPlaylistsFromUserReqRes: any = await Requests.playlist.getAllFromUser(userData.id, userData.token);
    if (!getAllPlaylistsFromUserReqRes.success) {
        app.throwError(`Can't get playlists from user: ${getAllPlaylistsFromUserReqRes.error}`);
        return null;
    }
    
    const playlistNames: string[] = getAllPlaylistsFromUserReqRes.playlists.map((p: Playlist) => p.name);
    const playlistNameAlreadyExists: boolean = playlistNames.includes(newPlaylistName);
    
    if (playlistNameAlreadyExists) {
        return {
            fieldName: "Name",
            error: `Playlist with name "${newPlaylistName}" already exists.`,
        };
    }

    let thumbnailFileName: string = "";
    if (file != null) {
        const uploadPlaylistThumbnailReqRes: any = await LoadingModal.create<any>("Uploading thumbnail", Requests.thumbnail.upload(userData.id, userData.token, file));
        if (!uploadPlaylistThumbnailReqRes.success) {
            app.throwError(`Can't uplaod playlist thumbnail: ${uploadPlaylistThumbnailReqRes.error}`);
            return null;
        }

        thumbnailFileName = uploadPlaylistThumbnailReqRes.fileName;
    }

    const addPlaylistReqRes: any = await Requests.playlist.add(userData.id, userData.token, newPlaylistName, thumbnailFileName);
    if (!addPlaylistReqRes.success) {
        app.throwError(`Can't add playlist: ${addPlaylistReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshPlaylistsContainerTab();

    const newPlaylistID: number = (addPlaylistReqRes.playlistID as number);
    app.playlistManager.open(newPlaylistID);

    TopModal.create("SUCCESS", `Successfully created playlist "${newPlaylistName}".`);
    return null;
}

export default function openCreatePlaylistModal(app: App): void {
    const content: ModalRow[] = [
        { label: "Name", type: "TEXT", maxLength: 150 },
        { label: "Thumbnail", type: "FILE" },
    ];

    const data: CenterModalData = {
        title: "Create a playlist",
        content: content,
        onConfirm: (modal: CenterModal): Promise<ModalError> => createPlaylistOnConfirm(app, modal),
        cantClose: false,
    };

    new CenterModal(app, data);
}
