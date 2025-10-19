import App from "./../app.js";
import CenterModal from "./../modals/modal.center.js";
import * as Requests from "./../utils/utils.requests.js";

async function addSongOnConfirm(app: App, res: ModalRes): Promise<ModalError> {
    const title: string = res[0].value;
    if (title.length < 1) {
        return "Title has to be at least 1 character long.";
    }

    const artist: string = res[1].value;
    if (artist.length < 1) {
        return "Artist has to be at least 1 character long.";
    }

    const file: File | null = CenterModal.getFileFromFileInput(2);
    if (file == null) {
        return "No file detected.";
    }

    if (file.type != "audio/mpeg") {
        return "File format is not supported.";
    }

    const fileSize: number = file.size / (1024 * 1024);
    if (fileSize > 30) {
        return "File is too large (max 30 mo)";
    }
    
    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        return "User is not connected.";
    }

    const uploadSongReqRes: any = await Requests.song.upload(userData.id, userData.token, file);
    if (!uploadSongReqRes.success) {
        return uploadSongReqRes.error;
    }

    const addSongReqRes: any = await Requests.song.add(userData.id, userData.token, title, artist, uploadSongReqRes.fileName);
    if (!addSongReqRes.success) {
        return addSongReqRes.error;
    }

    return null;
}

function getAddSongModalData(app: App): CenterModalData {
    return {
        title: "Add song to Heko",
        content: [
            { label: "Title", type: "TEXT", maxLength: 150, defaultValue: null, data: null },
            { label: "Artist", type: "TEXT", maxLength: 150, defaultValue: null, data: null },
            { label: "Song file", type: "FILE", maxLength: null, defaultValue: null, data: null },
        ],
        onConfirm: (res: ModalRes) => addSongOnConfirm(app, res),
        onCancel: null,
        additionnalButtons: [],
        cantClose: false,
    };
}

async function removeSongOnConfirm(app: App, res: ModalRes, songTitles: string[]): Promise<ModalError> {
    const title: string = res[0].value;

    const isTitleValid: boolean = songTitles.some((t: string) => t == title);
    if (!isTitleValid) {
        return "Song title is not valid.";
    }

    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        return "User is not connected.";
    }

    const removeSongReqRes: any = await Requests.song.remove(userData.id, userData.token, 0);
    if (!removeSongReqRes.success) {
        return removeSongReqRes.error;
    }

    return null;
}

function getRemoveSongModalData(app: App, songs: Song[]): CenterModalData {
    const songTitles: string[] = songs.map((song: Song) => song.title);

    return {
        title: "Remove song from Heko",
        content: [
            { label: "Title", type: "SELECT", maxLength: 150, defaultValue: null, data: songTitles },
        ],
        onConfirm: async (res: ModalRes) => await removeSongOnConfirm(app, res, songTitles),
        onCancel: null,
        additionnalButtons: [],
        cantClose: false,
    };
}

export default async function getSongSettingRows(app: App): Promise<ContextmenuRow[]> {
    return [

        { title: "Add song to Heko", shortcut: null, onClick: async () => {
            new CenterModal(app, getAddSongModalData(app));
        }, rows: null },

        { title: "Remove song from Heko", shortcut: null, onClick: async () => {

            const userData: UserData = app.account.getUserData();
            if (userData.id == null || userData.token == null) {
                return app.throwError("Can't open remove song modal: User is not connected.");
            }

            const songsFromUserReqRes: any = await Requests.song.getAllFromUser(userData.id, userData.token);
            if (!songsFromUserReqRes.success) {
                return app.throwError(songsFromUserReqRes.error);
            }

            const songs: Song[] = (songsFromUserReqRes.songs as Song[]);

            const modal: CenterModal = new CenterModal(app, getRemoveSongModalData(app, songs));
            modal.onChange("Title", (e: Event) => {
                console.log(e);
            });
            
        }, rows: null },

    ];
}
