import App from "./../app.js";
import CenterModal from "./../modals/modal.center.js";
import TopModal from "./../modals/modal.top.js";
import * as Requests from "./../utils/utils.requests.js";

async function createPlaylistOnConfirm(app: App, modal: CenterModal): Promise<ModalError> {
    const newPlaylistName: string = modal.getFieldValue("Name");
    if (newPlaylistName.length < 3) {
        return {
            fieldName: "Name",
            error: "Name has to be at least 3 characters long.",
        };
    }
    
    // const file: File | null = CenterModal.getFileFromFileInput("Thumbnail");
    // if (file != null) {
    //     if (!file.type.includes("image/")) {
    //         return {
    //             fieldName: "Thumbnail",
    //             error: "File format is not supported.",
    //         };
    //     }

    //     const fileSize: number = CenterModal.getFileSize(file);
    //     if (fileSize > 10) {
    //         return {
    //             fieldName: "Thumbnail",
    //             error: "File is too large (max 10 mo).",
    //         };
    //     }
    // }

    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        return {
            error: "User is not connected.",
        };
    }

    const getAllPlaylistsFromUserReqRes: any = await Requests.playlist.getAllFromUser(userData.id, userData.token);
    if (!getAllPlaylistsFromUserReqRes.success) {
        app.throwError(`Can't get every playlist from user: ${getAllPlaylistsFromUserReqRes.error}`);
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

    const addPlaylistReqRes: any = await Requests.playlist.add(userData.id, userData.token, newPlaylistName);
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

export function getCreatePlaylistModalData(app: App): CenterModalData {
    const content: ModalRow[] = [
        { label: "Name", type: "TEXT", maxLength: 150 },
        // { label: "Thumbnail", type: "FILE" },
    ];

    return {
        title: "Create a playlist",
        content: content,
        onConfirm: (modal: CenterModal): Promise<ModalError> => createPlaylistOnConfirm(app, modal),
        cantClose: false,
    };
}

export function getPlaylistContainerRows(app: App): ContextmenuRow[] {
    return [
        { title: "Create playlist", shortcut: { ctrl: true, shift: true, alt: false, key: "N" }, onClick: async () => {
            new CenterModal(app, getCreatePlaylistModalData(app));
        }, disabled: false },
    ];
}
