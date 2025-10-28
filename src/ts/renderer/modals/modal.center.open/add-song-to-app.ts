import App from "../../app.js";
import CenterModal from "../modal.center.js";
import LoadingModal from "../modal.loading.js";
import TopModal from "../modal.top.js";
import * as Requests from "../../utils/utils.requests.js";

async function addSongToAppModalOnConfirm(app: App, userSongs: Song[], modal: CenterModal): Promise<ModalError> {
    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        app.throwError("Can't add song to app: User is not logged in.");
        return null;
    }

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

    const file: File | null = CenterModal.getFileFromFileInput("Song file");
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

    const fileSize: number = CenterModal.getFileSize(file);
    if (fileSize > 30) {
        return {
            fieldName: "Song file",
            error: "File is too large (max 30 mo).",
        };
    }

    const uploadSongReqRes: any = await LoadingModal.create<any>("Uploading song", Requests.song.upload(userData.id, userData.token, file));
    if (!uploadSongReqRes.success) {
        app.throwError(`Can't upload song on server: ${uploadSongReqRes.error}`);
        return null;
    }

    const addSongToAppReqRes: any = await Requests.song.addToApp(userData.id, userData.token, title, artist, uploadSongReqRes.fileName);
    if (!addSongToAppReqRes.success) {
        app.throwError(`Can't add song to app: ${addSongToAppReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshOpenedPlaylistTab();
    TopModal.create("SUCCESS", `Successfully added song "${title}" by "${artist}" to Heko.`);
    return null;
}

export default async function openAddSongToAppModal(app: App, userSongs: Song[]): Promise<void> {
    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        return app.throwError("Can't open add song to app modal: User is not logged in.");
    }

    const getArtistsFromUserReqRes: any = await Requests.artist.getAllFromUser(userData.id, userData.token);
    if (!getArtistsFromUserReqRes.success) {
        return app.throwError(`Can't get artists from user: ${getArtistsFromUserReqRes.error}`);
    }

    const artistNames: string[] = [...new Set(["Unknown"].concat((getArtistsFromUserReqRes.artists as Artist[]).map((artist: Artist) => artist.name)))];

    const content: ModalRow[] = [
        { label: "Title", type: "TEXT", maxLength: 150 },
        { label: "Artist", type: "SELECT", maxLength: 150, data: artistNames },
        { label: "Song file", type: "FILE" },
    ];

    const data: CenterModalData = {
        title: "Add song to Heko",
        content: content,
        onConfirm: async (modal: CenterModal) => await addSongToAppModalOnConfirm(app, userSongs, modal),
        cantClose: false,
    };

    new CenterModal(app, data);
}
