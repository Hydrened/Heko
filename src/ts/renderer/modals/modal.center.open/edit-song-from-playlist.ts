import App from "../../app.js";
import CenterModal from "../modal.center.js";
import TopModal from "../modal.top.js";
import * as Requests from "../../utils/utils.requests.js";

async function editSongFromPlaylistModalOnConfirm(app: App, modal: CenterModal, song: Song): Promise<ModalError> {
    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        app.throwError("Can't edit song from playlist: User is not logged in.");
        return null;
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
            fieldName: "New artist",
            error: "Artist has to be at least 1 character long.",
        };
    }

    const editSongReqRes: any = await Requests.song.edit(userData.id, userData.token, song.id, newTitle, newArtist);
    if (!editSongReqRes.success) {
        app.throwError(`Can't edit song: ${editSongReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshOpenedPlaylistTab();
    TopModal.create("SUCCESS", `Successfully edited song "${song.title}" by "${song.artist}" to "${newTitle}" by "${newArtist}".`);
    return null;
}

export default async function openEditSongFromPlaylistModal(app: App, song: Song): Promise<void> {
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
        { label: "New title", type: "TEXT", maxLength: 150, defaultValue: song.title },
        { label: "New artist", type: "SELECT", maxLength: 150, defaultValue: song.artist, data: artistNames },
    ];

    const data: CenterModalData = {
        title: `Edit song "${song.title}" by "${song.artist}"`,
        content: content,
        onConfirm: async (modal: CenterModal) => await editSongFromPlaylistModalOnConfirm(app, modal, song),
        cantClose: false,
    };

    new CenterModal(app, data);
}
