import App from "./../../app.js";
import * as Requests from "./../../utils/utils.requests.js";
import * as Functions from "./../../utils/utils.functions.js";

async function addSongFileToAppModalOnConfirm(app: App, userSongs: Song[], modal: CenterModal): Promise<ModalError> {
    const title: string = modal.getFieldValue("Title");
    if (title.length < 1) {
        return {
            fieldName: "Title",
            error: "Title has to be at least 1 character long.",
        };
    }

    const artist: string = modal.getFieldValue("Artist");
    if (artist.length < 1) {
        return {
            fieldName: "Artist",
            error: "Artist has to be at least 1 character long.",
        };
    }

    const songAlreadyExists: boolean = userSongs.some((song: Song) => song.title == title && song.artist == artist);
    if (songAlreadyExists) {
        return {
            fieldName: "Title",
            error: "Song with same title and artist already exists.",
        };
    }

    const currentCenterModal: CenterModal | null = app.modalManager.getCurrentCenterModal();
    if (currentCenterModal == null) {
        return {
            error: "Can't confirm modal: Current center modal is null.",
        };
    }

    const file: File | null = currentCenterModal.getFileFromFileInput("Song file");
    if (file == null) {
        return {
            fieldName: "Song file",
            error: "No file detected.",
        };
    }

    if (file.type != "audio/mpeg") {
        return {
            fieldName: "Song file",
            error: "File format is not supported.",
        };
    }

    const fileSize: number = Functions.getFileSize(file);
    if (fileSize > 30) {
        return {
            fieldName: "Song file",
            error: "File is too large (max 30 mo).",
        };
    }

    const uploadSongReqRes: any = await app.modalManager.openLoadingModal("Uploading song", Requests.song.upload(app, file));
    if (!uploadSongReqRes.success) {
        app.throwError(`Can't upload song on server: ${uploadSongReqRes.error}`);
        return null;
    }

    const addSongToAppReqRes: any = await Requests.song.addToApp(app, title, artist, uploadSongReqRes.fileName);
    if (!addSongToAppReqRes.success) {
        app.throwError(`Can't add song to app: ${addSongToAppReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshSongBuffer();
    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshOpenedPlaylistTab();
    });
    
    app.modalManager.openTopModal("SUCCESS", `Successfully added song "${title}" by "${artist}" to Heko.`);
    return null;
}

export default function openAddSongFileToAppModal(app: App, userSongs: Song[]): void {
    const content: ModalRow[] = [
        { label: "Title", type: "TEXT", maxLength: 150 },
        { label: "Artist", type: "SELECT", maxLength: 150, data: app.playlistManager.getArtistNames() },
        { label: "Song file", type: "FILE", data: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac"] },
    ];

    const data: CenterModalData = {
        title: "Add song to Heko",
        content: content,
        onConfirm: async (modal: CenterModal) => await addSongFileToAppModalOnConfirm(app, userSongs, modal),
        cantClose: false,
    };

    app.modalManager.openCenterModal(data);
}
