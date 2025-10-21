import ModalTop from "../modals/modal.top.js";
import App from "./../app.js";
import CenterModal from "./../modals/modal.center.js";
import * as Requests from "./../utils/utils.requests.js";

async function removeSongOnConfirm(app: App, playlist: Playlist, song: Song): Promise<ModalError> {

    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        return {
            error: "User is not connected.",
        };
    }

    const removeSongFromPlaylistReqRes: any = await Requests.song.removeFromPlaylist(userData.id, userData.token, song.id);
    if (!removeSongFromPlaylistReqRes.success) {
        app.throwError(`Can't remove song from playlist: ${removeSongFromPlaylistReqRes.error}`);
        return null;
    }

    await app.playlistManager.refresh();
    ModalTop.create("SUCCESS", `Successfully removed song "${song.title}" by "${song.artist}" from playlist "${playlist.name}".`);
    return null;
}

function getRemoveSongFromPlaylistModalData(app: App, currentPlaylist: Playlist, song: Song): CenterModalData {
    return {
        title: `Are you sure you want to remove song "${song.title}" by "${song.artist}" from playlist "${currentPlaylist.name}"`,
        onConfirm: async (res: ModalRes) => await removeSongOnConfirm(app, currentPlaylist, song),
        cantClose: false,
    };
}

export default async function getSongRows(app: App, song: Song): Promise<ContextmenuRow[]> {
    const currentPlaylist: Playlist | null = app.playlistManager.getCurrentPlaylist();
    if (currentPlaylist == null) {
        app.throwError("Can't get song contextmenu rows: Current playlist is null.");
        return [];
    }

    return [
        // { title: "Add to queue", onClick: async () => {
            
        // } },

        { title: "Remove from playlist", onClick: async () => {
            new CenterModal(app, getRemoveSongFromPlaylistModalData(app, currentPlaylist, song));
        }, disabled: false },

        // { title: "Add to other playlist", onClick: async () => {
            
        // } },

        // { title: "Edit song", onClick: async () => {
            
        // } },
    ];
}
