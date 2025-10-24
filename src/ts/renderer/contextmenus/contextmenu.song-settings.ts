import App from "./../app.js";
import CenterModal from "./../modals/modal.center.js";
import TopModal from "../modals/modal.top.js";
import LoadingModal from "../modals/modal.loading.js";
import * as Requests from "./../utils/utils.requests.js";

async function addSongOnConfirm(app: App, userID: ID, token: Token, userSongs: Song[], artistNames: string[], modal: CenterModal): Promise<ModalError> {
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

    if (!artistNames.includes(artist)) {
        const addArtistReqRes: any = await Requests.artist.add(userID, token, artist);
        if (!addArtistReqRes.success) {
            app.throwError(`Can't add artist: ${addArtistReqRes.error}`);
            return null;
        }
    }

    const uploadSongReqRes: any = await LoadingModal.create<any>("Uploading file", Requests.song.upload(userID, token, file));
    if (!uploadSongReqRes.success) {
        app.throwError(`Can't upload song on server: ${uploadSongReqRes.error}`);
        return null;
    }

    const addSongToAppReqRes: any = await Requests.song.addToApp(userID, token, title, artist, uploadSongReqRes.fileName);
    if (!addSongToAppReqRes.success) {
        app.throwError(`Can't add song to app: ${addSongToAppReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshOpenedPlaylistTab();
    TopModal.create("SUCCESS", `Successfully added song "${title}" by "${artist}" to Heko.`);
    return null;
}

async function getAddSongModalData(app: App, userID: ID, token: Token, userSongs: Song[]): Promise<CenterModalData> {
    const getArtistsFromUserReqRes: any = await Requests.artist.getAllFromUser(userID, token);
    if (!getArtistsFromUserReqRes.success) {
        app.throwError(`Can't get artists from user: ${getArtistsFromUserReqRes.error}`);
    }

    const artistNames: string[] = (getArtistsFromUserReqRes.artists as Artist[]).map((artist: Artist) => artist.name);
    artistNames.unshift("Unknown");

    return {
        title: "Add song to Heko",
        content: [
            { label: "Title", type: "TEXT", maxLength: 150 },
            { label: "Artist", type: "SELECT", maxLength: 150, data: artistNames },
            { label: "Song file", type: "FILE" },
        ],
        onConfirm: async (modal: CenterModal) => await addSongOnConfirm(app, userID, token, userSongs, artistNames, modal),
        cantClose: false,
    };
}

async function editSongOnConfirm(app: App, userID: ID, token: Token, modal: CenterModal, userSongs: Song[]): Promise<ModalError> {
    const songIndex: number | undefined = modal.getFieldValueIndex("Song to edit");
    if (songIndex == undefined) {
        return {
            fieldName: "Song to edit",
            error: "Song is not valid.",
        };
    }

    const newTitle: string = modal.getFieldValue("New title");
    if (newTitle.length < 1) {
        return {
            fieldName: "New title",
            error: "Title has to be at least 1 character long.",
        };
    }

    const newArtist: string = modal.getFieldValue("New artist");
    if (newArtist.length < 1) {
        return {
            fieldName: "new Artist",
            error: "Artist has to be at least 1 character long.",
        };
    }

    const song: Song = userSongs[songIndex];

    const editSongReqRes: any = await Requests.song.edit(userID, token, song.id, newTitle, newArtist);
    if (!editSongReqRes.success) {
        app.throwError(`Can't edit song: ${editSongReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshOpenedPlaylistTab();
    TopModal.create("SUCCESS", `Successfully edited song "${song.title}" by "${song.artist}" to "${newTitle}" by "${newArtist}".`);
    return null;
}

function editSongSongToEditOnChange(app: App, modal: CenterModal, userSongs: Song[]): void {
    modal.setFieldValue("New title", "");
    modal.setFieldValue("New artist", "");

    const songToEditIndex: number | undefined = modal.getFieldValueIndex("Song to edit");
    if (songToEditIndex == undefined) {
        return;
    }

    const songToEdit: Song = userSongs[songToEditIndex];
    modal.setFieldValue("New title", songToEdit.title);
    modal.setFieldValue("New artist", songToEdit.artist);
}

function getEditSongModalData(app: App, userID: ID, token: Token, userSongs: Song[]): CenterModalData {
    const songTitles: string[] = userSongs.map((song: Song) => song.title);

    return {
        title: "Edit song from Heko",
        content: [
            { label: "Song to edit", type: "SELECT", maxLength: 150, data: songTitles, onChange: (modal: CenterModal) => editSongSongToEditOnChange(app, modal, userSongs) },
            { label: "New title", type: "TEXT", maxLength: 150 },
            { label: "New artist", type: "TEXT", maxLength: 150 },
        ],
        onConfirm: async (modal: CenterModal) => await editSongOnConfirm(app, userID, token, modal, userSongs),
        cantClose: false,
    };
}

async function removeSongOnConfirm(app: App, userID: ID, token: Token, modal: CenterModal, userSongs: Song[]): Promise<ModalError> {
    const songIndex: number | undefined = modal.getFieldValueIndex("Title");
    if (songIndex == undefined) {
        return {
            fieldName: "Title",
            error: "Song title is not valid.",
        };
    }

    const song: Song = userSongs[songIndex];
    
    const removeSongFromAppReqRes: any = await Requests.song.removeFromApp(userID, token, song.id, song.fileName);
    if (!removeSongFromAppReqRes.success) {
        app.throwError(`Can't remove song from app: ${removeSongFromAppReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshOpenedPlaylistTab();
    TopModal.create("SUCCESS", `Successfully removed song "${song.title}" by "${song.artist}" from Heko.`);
    return null;
}

function getRemoveSongModalData(app: App, userID: ID, token: Token, songs: Song[]): CenterModalData {
    const songTitles: string[] = songs.map((song: Song) => song.title);

    return {
        title: "Remove song from Heko",
        content: [
            { label: "Title", type: "SELECT", maxLength: 150, data: songTitles },
        ],
        onConfirm: async (modal: CenterModal) => await removeSongOnConfirm(app, userID, token, modal, songs),
        cantClose: false,
    };
}

export async function getSongSettingRows(app: App): Promise<ContextmenuRow[]> {
    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        app.throwError("Can't get song settings contextmenu rows: User is not connected.");
        return [];
    }

    const userID: ID = userData.id;
    const token: string = userData.token;

    const songsFromUserReqRes: any = await Requests.song.getAllFromUser(userData.id, userData.token);
    if (!songsFromUserReqRes.success) {
        app.throwError(`Can't get song settings contextmenu rows: ${songsFromUserReqRes.error}`);
        return [];
    }

    const userSongs: Song[] = (songsFromUserReqRes.songs as Song[]);
    const hasUserSongs: boolean = (userSongs.length > 0);

    return [
        { title: "Add song to Heko", onClick: async () => {
            new CenterModal(app, await getAddSongModalData(app, userID, token, userSongs));
        }, disabled: false },

        { title: "Edit song from Heko", onClick: async () => {
            new CenterModal(app, getEditSongModalData(app, userID, token, userSongs));
        }, disabled: !hasUserSongs },

        { title: "Remove song from Heko", onClick: async () => {
            new CenterModal(app, getRemoveSongModalData(app, userID, token, userSongs));
        }, disabled: !hasUserSongs },
    ];
}
