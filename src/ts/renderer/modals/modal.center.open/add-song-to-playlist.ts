import App from "./../../app.js";
import CenterModal from "./../modal.center.js";
import TopModal from "./../modal.top.js";
import * as Requests from "./../../utils/utils.requests.js";

async function addSongToPlaylistModalOnConfirm(app: App, modal: CenterModal, songsLeft: Song[]): Promise<ModalError> {
    const currentPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentPlaylist == null) {
        app.throwError("Can't add song to playlist: Current playlist is null.");
        return null;
    }

    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        return {
            error: "User is not logged in.",
        };
    }

    const songIndex: number | undefined = modal.getFieldValueIndex("Title");
    if (songIndex == undefined) {
        return {
            fieldName: "Title",
            error: "Song is not valid.",
        };
    }

    const song: Song = songsLeft[songIndex];

    const addSongToPlaylistReqRes: any = await Requests.song.addToPlaylist(userData.id, userData.token, song.id, currentPlaylist.id);
    if (!addSongToPlaylistReqRes.success) {
        app.throwError(`Can't add song to playlist: ${addSongToPlaylistReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();
        app.playlistManager.refreshOpenedPlaylistTab();
    });

    TopModal.create("SUCCESS", `Successfully added song "${song.title}" by "${song.artist}" to playlist "${currentPlaylist.name}".`);
    return null;
}

export default function openAddSongToPlaylistModal(app: App, songsLeft: Song[]): void {
    const currentOpenedPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentOpenedPlaylist == null) {
        return app.throwError("Can't open add song to playlist modal: Current playlist is null.");
    }

    const songTitlesLeft: string[] = songsLeft.map((song: Song) => song.title);

    const content: ModalRow[] = [
        { label: "Title", type: "SELECT", data: songTitlesLeft },
    ];

    const data: CenterModalData = {
        title: `Add song to ${currentOpenedPlaylist.name}`,
        content: content,
        onConfirm: async (modal: CenterModal) => await addSongToPlaylistModalOnConfirm(app, modal, songsLeft),
        cantClose: false,
    };

    new CenterModal(app, data);
}
