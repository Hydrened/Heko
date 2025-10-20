import App from "./../app.js";
import CenterModal from "./../modals/modal.center.js";
import * as Requests from "./../utils/utils.requests.js";

async function removeSongOnConfirm(app: App, songID: ID): Promise<ModalError> {

    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        return "User is not connected.";
    }

    const removeSongFromPlaylistReqRes: any = await Requests.song.removeFromPlaylist(userData.id, userData.token, songID);
    if (!removeSongFromPlaylistReqRes.success) {
        return removeSongFromPlaylistReqRes.error;
    }

    app.playlistManager.refresh();    
    return null;
}

function getRemoveSongFromPlaylistModalData(app: App, currentPlaylist: Playlist, song: Song): CenterModalData {
    return {
        title: `Are you sure you want to remove song "${song.title}" by "${song.artist}" from playlist "${currentPlaylist.name}"`,
        onConfirm: async (res: ModalRes) => await removeSongOnConfirm(app, song.id),
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
        } },

        // { title: "Add to other playlist", onClick: async () => {
            
        // } },

        // { title: "Edit song", onClick: async () => {
            
        // } },

    ];
}
