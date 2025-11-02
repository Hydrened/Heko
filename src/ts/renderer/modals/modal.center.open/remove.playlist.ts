import App from "./../../app.js";
import PlaylistManager from "./../../playlists/playlists.js";
import CenterModal from "./../modal.center.js";
import TopModal from "./../modal.top.js";
import * as Requests from "./../../utils/utils.requests.js";

async function removePlaylistModalOnConfirm(app: App, userPlaylists: Playlist[], playlist: Playlist, modal: CenterModal): Promise<ModalError> {
    const childrenIDs: ID[] = PlaylistManager.getPlaylistChildrenIDs(userPlaylists, playlist.id);

    const playlists: Playlist[] = app.playlistManager.getPlaylistBuffer();
    const thumbnailFileNames: string[] = playlists.filter((p: Playlist) => (childrenIDs.includes(p.id) || p.id == playlist.id)).map((p: Playlist) => p.thumbnailFileName);

    const removePlaylistReqRes: any = await Requests.playlist.remove(app, childrenIDs.concat(playlist.id), thumbnailFileNames);
    if (!removePlaylistReqRes.success) {
        app.throwError(`Can't remove playlist: ${removePlaylistReqRes.error}`);
        return null;
    }
    
    const currentOpenedPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();

    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();
        app.playlistManager.refreshOpenedPlaylistTab();

        if (currentOpenedPlaylist != null) {
            if (childrenIDs.concat(playlist.id).includes(currentOpenedPlaylist.id)) {
                app.playlistManager.close().then(() => {
                    app.openFirstPlaylist();
                });
            }
        }
    });

    TopModal.create("SUCCESS", `Successfully removed playlist "${playlist.name}".`);
    return null;
}

export default function openRemovePlaylistModal(app: App, userPlaylists: Playlist[], playlist: Playlist): void {
    const data: CenterModalData = {
        title: `Are you sure you want to remove playlist "${playlist.name}"? Children playlist(s) will also be deleted.`,
        onConfirm: async (modal: CenterModal) => await removePlaylistModalOnConfirm(app, userPlaylists, playlist, modal),
        cantClose: false,
    };

    new CenterModal(app, data);
}
