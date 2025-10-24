import App from "./../app.js";
import CenterModal from "./../modals/modal.center.js";
import TopModal from "./../modals/modal.top.js";
import * as Requests from "./../utils/utils.requests.js";

async function addSongToPlaylistOnClick(app: App, userID: ID, token: Token, playlist: Playlist, song: Song): Promise<void> {
    const addSongToPlaylistReqRes: any = await Requests.song.addToPlaylist(userID, token, song.id, playlist.id);
    if (!addSongToPlaylistReqRes.success) {
        return app.throwError(`Can't add song to playlist: ${addSongToPlaylistReqRes.error}`);
    }

    app.playlistManager.refreshPlaylistsContainerTab();
    TopModal.create("SUCCESS", `Successfully added song "${song.title}" by "${song.artist}" to playlist "${playlist.name}".`);
}

async function editSongOnConfirm(app: App, modal: CenterModal, song: Song): Promise<ModalError> {
    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        return {
            error: "User is not connected.",
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

function getEditSongModalData(app: App, song: Song): CenterModalData {
    return {
        title: `Edit song "${song.title}" by "${song.artist}"`,
        content: [
            { label: "New title", type: "TEXT", maxLength: 150, defaultValue: song.title },
            { label: "New artist", type: "TEXT", maxLength: 150, defaultValue: song.artist },
        ],
        onConfirm: async (modal: CenterModal) => await editSongOnConfirm(app, modal, song),
        cantClose: false,
    };
}

async function removeSongOnConfirm(app: App, playlist: Playlist, song: Song): Promise<ModalError> {
    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        return {
            error: "User is not connected.",
        };
    }

    const removeSongFromPlaylistReqRes: any = await Requests.song.removeFromPlaylist(userData.id, userData.token, playlist.id, song.id);
    if (!removeSongFromPlaylistReqRes.success) {
        app.throwError(`Can't remove song from playlist: ${removeSongFromPlaylistReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshPlaylistsContainerTab();
    app.playlistManager.refreshOpenedPlaylistTab();
    TopModal.create("SUCCESS", `Successfully removed song "${song.title}" by "${song.artist}" from playlist "${playlist.name}".`);
    return null;
}

function getRemoveSongFromPlaylistModalData(app: App, currentPlaylist: Playlist, song: Song): CenterModalData {
    return {
        title: `Are you sure you want to remove song "${song.title}" by "${song.artist}" from playlist "${currentPlaylist.name}"`,
        onConfirm: async (modal: CenterModal) => await removeSongOnConfirm(app, currentPlaylist, song),
        cantClose: false,
    };
}

export async function getSongRows(app: App, song: Song): Promise<ContextmenuRow[]> {
    const errorBase: string = "Can't get song contextmenu rows";

    const currentPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentPlaylist == null) {
        app.throwError(`${errorBase}: Current playlist is null.`);
        return [];
    }

    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        app.throwError(`${errorBase}: User is not logged in.`);
        return [];
    }

    const getPlaylistFromUserWhereSongIsNotInReqRes: any = await Requests.playlist.getWhereSongInNotIn(userData.id, userData.token, song.id);
    if (!getPlaylistFromUserWhereSongIsNotInReqRes.success) {
        app.throwError(`Can't get songs from users: ${getPlaylistFromUserWhereSongIsNotInReqRes.error}`);
        return [];
    }

    const playlistsWhereSongIsNotIn: Playlist[] = (getPlaylistFromUserWhereSongIsNotInReqRes.playlists as Playlist[]);

    const addToOtherPlaylistRows: ContextmenuRow[] = [];
    for (const playlist of playlistsWhereSongIsNotIn) {
        addToOtherPlaylistRows.push({
            title: playlist.name,
            onClick: async () => await addSongToPlaylistOnClick(app, userData.id!, userData.token!, playlist, song),
            disabled: false,
        });
    }

    const hasNoOtherPlaylistWithoutSong: boolean = (addToOtherPlaylistRows.length == 0);

    return [
        // { title: "Add to queue", onClick: async () => {
            
        // } },

        { title: "Add to other playlist", rows: addToOtherPlaylistRows, disabled: hasNoOtherPlaylistWithoutSong },

        { title: "Edit song", onClick: async () => {
            new CenterModal(app, getEditSongModalData(app, song));
        }, disabled: false },

        { title: "Remove from playlist", onClick: async () => {
            new CenterModal(app, getRemoveSongFromPlaylistModalData(app, currentPlaylist, song));
        }, disabled: false },
    ];
}
