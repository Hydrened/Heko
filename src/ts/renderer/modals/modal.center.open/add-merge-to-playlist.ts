import App from "../../app.js";
import * as Requests from "../../utils/utils.requests.js";

async function addSongToPlaylistModalOnConfirm(app: App, modal: CenterModal, playlistsLeft: Playlist[]): Promise<ModalError> {
    const currentOpenedPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentOpenedPlaylist == null) {
        app.throwError("Can't add playlist to merge in playlist: Current opened playlist is null.");
        return null;
    }

    const playlistIndex: number | undefined = modal.getFieldValueIndex("Name");
    if (playlistIndex == undefined) {
        return {
            fieldName: "Name",
            error: "Playlist is not valid.",
        };
    }

    const playlist: Playlist = playlistsLeft[playlistIndex];

    const mergePlaylistInReqRes: any = await Requests.playlist.mergeIn(app, currentOpenedPlaylist.id, playlist.id);
    if (!mergePlaylistInReqRes.success) {
        app.throwError(`Can't add playlist to merge in playlist: ${mergePlaylistInReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();
        app.playlistManager.refreshOpenedPlaylistTab();
    });

    app.modalManager.openTopModal("SUCCESS", `Successfully merged playlist "${playlist.name}" in playlist "${currentOpenedPlaylist.name}".`);
    return null;
}

export default function openAddMergeToPlaylistModal(app: App, playlistsLeft: Playlist[]): void {
    const currentOpenedPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentOpenedPlaylist == null) {
        return app.throwError("Can't open add playlist to merge in playlist modal: Current opened playlist is null.");
    }

    const playlistNamesLeft: string[] = playlistsLeft.map((playlist: Playlist) => playlist.name);

    const content: ModalRow[] = [
        { label: "Name", type: "SELECT", data: playlistNamesLeft },
    ];

    const data: CenterModalData = {
        title: `Add a playlist to merge in ${currentOpenedPlaylist.name}`,
        content: content,
        onConfirm: async (modal: CenterModal) => await addSongToPlaylistModalOnConfirm(app, modal, playlistsLeft),
        cantClose: false,
    };

    app.modalManager.openCenterModal(data);
}
