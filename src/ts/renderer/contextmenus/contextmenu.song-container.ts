import App from "./../app.js";
import CenterModal from "./../modals/modal.center.js";
import TopModal from "./../modals/modal.top.js";
import * as Requests from "./../utils/utils.requests.js";

async function addSongOnConfirm(app: App, modal: CenterModal, songsLeft: Song[]): Promise<ModalError> {
    const currentPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentPlaylist == null) {
        return {
            error: "Current playlist is null.",
        };
    }

    const songIndex: number | undefined = modal.getFieldValueIndex("Title");
    if (songIndex == undefined) {
        return {
            fieldName: "Title",
            error: "Song is not valid.",
        };
    }

    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        return {
            error: "User is not logged in.",
        };
    }

    const song: Song = songsLeft[songIndex];

    const addSongToPlaylistReqRes: any = await Requests.song.addToPlaylist(userData.id, userData.token, song.id, currentPlaylist.id);
    if (!addSongToPlaylistReqRes.success) {
        app.throwError(`Can't add song to playlist: ${addSongToPlaylistReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshPlaylistsContainerTab();
    app.playlistManager.refreshOpenedPlaylistTab();
    TopModal.create("SUCCESS", `Successfully added song "${song.title}" by "${song.artist}" to playlist "${currentPlaylist.name}".`);
    return null;
}

export function getAddSongModalData(app: App, userID: ID, token: Token, openedPlaylist: Playlist, songsLeft: Song[]): CenterModalData {
    const songTitlesLeft: string[] = songsLeft.map((song: Song) => song.title);

    const content: ModalRow[] = [
        { label: "Title", type: "SELECT", data: songTitlesLeft },
    ];

    return {
        title: `Add song to ${openedPlaylist.name}`,
        content: content,
        onConfirm: async (modal: CenterModal) => await addSongOnConfirm(app, modal, songsLeft),
        cantClose: false,
    };
}

export async function getSongsLeft(app: App, userID: ID, token: Token, openedPlaylist: Playlist): Promise<Song[]> {
    const getAllSongsFromUserReqRes: any = await Requests.song.getAllFromUser(userID, token);
    if (!getAllSongsFromUserReqRes.success) {
        app.throwError(`Can't get songs from user: ${getAllSongsFromUserReqRes.error}`);
        return [];
    }

    const getSongsFromPlaylistReqRes: any = await Requests.song.getFromPlaylist(userID, token, openedPlaylist.id);
    if (!getSongsFromPlaylistReqRes.success) {
        app.throwError(`Can't get songs from playlist: ${getSongsFromPlaylistReqRes.error}`);
        return [];
    }

    const songTitlesFromPlaylist: string[] = (getSongsFromPlaylistReqRes.songs as Song[]).map((song: Song) => song.title);

    return (getAllSongsFromUserReqRes.songs as Song[]).filter((song: Song) => {
        return !songTitlesFromPlaylist.includes(song.title);
    });
}

export async function getSongContainerRows(app: App, openedPlaylist: Playlist): Promise<ContextmenuRow[]> {
    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        app.throwError("Can't open add song to playlist modal: User is not logged in.");
        return [];
    }

    const userID: ID = userData.id;
    const token: string = userData.token;

    const songsLeft: Song[] = await getSongsLeft(app, userID, token, openedPlaylist);
    const isAddSongRowDisabled: boolean = (songsLeft.length == 0);

    return [
        { title: "Add song", shortcut: { ctrl: true, shift: false, alt: false, key: "N" }, onClick: async () => {
            new CenterModal(app, getAddSongModalData(app, userID, token, openedPlaylist, songsLeft));
        }, disabled: isAddSongRowDisabled },
    ];
}
