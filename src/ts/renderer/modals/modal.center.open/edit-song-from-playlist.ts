import App from "./../../app.js";
import * as Api from "./../../utils/utils.api.js";

async function modalOnConfirm(app: App, modal: CenterModal, song: Song): Promise<ModalError> {
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

    const editSongReqRes: any = await Api.song.edit(app, song.id, newTitle, newArtist);
    if (!editSongReqRes.success) {
        app.throwError(`Can't edit song: ${editSongReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshSongBuffer();
    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshOpenedPlaylistTab();
        app.listenerManager.refresh();
    });

    app.modalManager.openTopModal("SUCCESS", `Successfully edited song "${song.title}" by "${song.artist}" to "${newTitle}" by "${newArtist}".`);
    return null;
}

export default function openEditSongFromPlaylistModal(app: App, song: Song): void {
    const content: ModalRow[] = [
        { label: "New title", type: "TEXT", maxLength: 150, defaultValue: song.title },
        { label: "New artist", type: "SELECT", maxLength: 150, defaultValue: song.artist, data: app.playlistManager.getArtistNames() },
    ];

    const data: CenterModalData = {
        title: `Edit song "${song.title}" by "${song.artist}"`,
        content: content,
        onConfirm: async (modal: CenterModal) => await modalOnConfirm(app, modal, song),
        cantClose: false,
    };

    app.modalManager.openCenterModal(data);
}
