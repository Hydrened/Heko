import App from "../../app.js";
import CenterModal from "../modal.center.js";
import TopModal from "../modal.top.js";
import * as Requests from "../../utils/utils.requests.js";

async function editSongFromAppModalOnConfirm(app: App, modal: CenterModal, userSongs: Song[]): Promise<ModalError> {
    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        app.throwError("Can't edit song from app: User is not logged in.");
        return null;
    }

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

    const editSongReqRes: any = await Requests.song.edit(userData.id, userData.token, song.id, newTitle, newArtist);
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

export default async function openEditFromAppSongModal(app: App, userSongs: Song[]): Promise<void> {
    const songTitles: string[] = userSongs.map((song: Song) => song.title);

    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        return app.throwError("Can't open edit song from app modal: User is not logged in.");
    }

    const getArtistFromUserReqRes: any = await Requests.artist.getAllFromUser(userData.id, userData.token);
    if (!getArtistFromUserReqRes.success) {
        return app.throwError(`Can't get artists from user: ${getArtistFromUserReqRes.error}`);
    }

    const artistsFromUser: Artist[] = (getArtistFromUserReqRes.artists as Artist[]);
    const artistNames: string[] = [...new Set(["Unknown"].concat(artistsFromUser.map((artist: Artist) => artist.name)))];

    const content: ModalRow[] = [
        { label: "Song to edit", type: "SELECT", maxLength: 150, data: songTitles, onChange: (modal: CenterModal) => editSongSongToEditOnChange(app, modal, userSongs) },
        { label: "New title", type: "TEXT", maxLength: 150 },
        { label: "New artist", type: "SELECT", maxLength: 150, data: artistNames },
    ];

    const data: CenterModalData = {
        title: "Edit song from Heko",
        content: content,
        onConfirm: async (modal: CenterModal) => await editSongFromAppModalOnConfirm(app, modal, userSongs),
        cantClose: false,
    };

    new CenterModal(app, data);
}
