import App from "./../../app.js";
import TopModal from "./../../modals/modal.top.js";
import openEditSongFromPlaylistModal from "./../../modals/modal.center.open/edit-song-from-playlist.js";
import openRemoveSongFromPlaylistModal from "./../../modals/modal.center.open/remove-song-from-playlist.js";
import * as Requests from "./../../utils/utils.requests.js";

async function addSongToPlaylistOnClick(app: App, userID: ID, token: Token, playlist: Playlist, song: Song): Promise<void> {
    const addSongToPlaylistReqRes: any = await Requests.song.addToPlaylist(userID, token, song.id, playlist.id);
    if (!addSongToPlaylistReqRes.success) {
        return app.throwError(`Can't add song to playlist: ${addSongToPlaylistReqRes.error}`);
    }

    app.playlistManager.refreshPlaylistsContainerTab();
    TopModal.create("SUCCESS", `Successfully added song "${song.title}" by "${song.artist}" to playlist "${playlist.name}".`);
}

export async function getSongRows(app: App, song: Song): Promise<ContextmenuRow[]> {
    const errorBase: string = "Can't get song contextmenu rows";

    const currentOpenedPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentOpenedPlaylist == null) {
        app.throwError(`${errorBase}: Current opened playlist is null.`);
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
        if (playlist.children != 0) {
            continue;
        }

        addToOtherPlaylistRows.push({
            title: playlist.name,
            onClick: async () => await addSongToPlaylistOnClick(app, userData.id!, userData.token!, playlist, song),
            disabled: false,
        });
    }

    const disableAddToQueue: boolean = (app.listenerManager.getCurrentListeningPlaylist() == null);
    const disableAddToOtherPlaylist: boolean = (addToOtherPlaylistRows.length == 0);

    return [
        { title: "Add to queue", onClick: async () => {
            app.listenerManager.addSongToQueue(song);
            TopModal.create("SUCCESS", `Successfully added song "${song.title}" by "${song.artist}" to queue.`);
        }, disabled: disableAddToQueue },

        { title: "Add to other playlist", rows: addToOtherPlaylistRows, disabled: disableAddToOtherPlaylist },

        { title: "Remove from playlist", onClick: async () => {
            openRemoveSongFromPlaylistModal(app, currentOpenedPlaylist, song);
        }, disabled: false },

        { title: "Edit song", onClick: async () => {
            await openEditSongFromPlaylistModal(app, song);
        }, disabled: false },
    ];
}
