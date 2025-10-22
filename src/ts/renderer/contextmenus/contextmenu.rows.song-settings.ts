import App from "./../app.js";
import CenterModal from "./../modals/modal.center.js";
import ModalTop from "../modals/modal.top.js";
import LoadingModal from "../modals/modal.loading.js";
import * as Requests from "./../utils/utils.requests.js";

async function addSongOnConfirm(app: App, userID: ID, token: Token, artistNames: string[], res: ModalRes): Promise<ModalError> {
    const title: string = res.rows["Title"].value;
    if (title.length < 1) {
        return {
            fieldName: "Title",
            error: "Title has to be at least 1 character long.",
        };
    }

    const artist: string = res.rows["Artist"].value;
    if (artist.length < 1) {
        return {
            fieldName: "Artist",
            error: "Artist has to be at least 1 character long.",
        };
    }

    const file: File | null = CenterModal.getFileFromFileInput(2);
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

    const fileSize: number = file.size / (1024 * 1024);
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

    await app.playlistManager.refresh();
    ModalTop.create("SUCCESS", `Successfully added song "${title}" by "${artist}" to Heko.`);
    return null;
}

async function getAddSongModalData(app: App, userID: ID, token: Token): Promise<CenterModalData> {
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
        onConfirm: async (res: ModalRes) => await addSongOnConfirm(app, userID, token, artistNames, res),
        cantClose: false,
    };
}

async function removeSongOnConfirm(app: App, userID: ID, token: Token, res: ModalRes, songs: Song[]): Promise<ModalError> {
    const songIndex: number | undefined = res.rows["Title"].index;
    if (songIndex == undefined) {
        return {
            fieldName: "Title",
            error: "Song title is not valid.",
        };
    }

    const song: Song = songs[songIndex];
    
    const removeSongFromAppReqRes: any = await Requests.song.removeFromApp(userID, token, song.id, song.fileName);
    if (!removeSongFromAppReqRes.success) {
        app.throwError(`Can't remove song from app: ${removeSongFromAppReqRes.error}`);
        return null;
    }

    await app.playlistManager.refresh();
    ModalTop.create("SUCCESS", `Successfully removed song "${song.title}" by "${song.artist}" from Heko.`);
    return null;
}

function getRemoveSongModalData(app: App, userID: ID, token: Token, songs: Song[]): CenterModalData {
    const songTitles: string[] = songs.map((song: Song) => song.title);

    return {
        title: "Remove song from Heko",
        content: [
            { label: "Title", type: "SELECT", maxLength: 150, data: songTitles },
        ],
        onConfirm: async (res: ModalRes) => await removeSongOnConfirm(app, userID, token, res, songs),
        cantClose: false,
    };
}

export default async function getSongSettingRows(app: App): Promise<ContextmenuRow[]> {
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

    const songs: Song[] = (songsFromUserReqRes.songs as Song[]);
    const hasUserSongs: boolean = (songs.length > 0);

    return [
        { title: "Add song to Heko", onClick: async () => {
            new CenterModal(app, await getAddSongModalData(app, userID, token));
        }, disabled: false },

        { title: "Remove song from Heko", onClick: async () => {
            new CenterModal(app, getRemoveSongModalData(app, userID, token,songs));
        }, disabled: !hasUserSongs },
    ];
}
