import App from "./../../app.js";
import * as Requests from "./../../utils/utils.requests.js";

async function removeSongFromAppModalOnConfirm(app: App, modal: CenterModal, userSongs: Song[]): Promise<ModalError> {
    const songIndex: number | undefined = modal.getFieldValueIndex("Title");
    if (songIndex == undefined) {
        return {
            fieldName: "Title",
            error: "Song title is not valid.",
        };
    }

    const song: Song = userSongs[songIndex];
    
    const removeSongFromAppReqRes: any = await Requests.song.removeFromApp(app, song.id, song.fileName);
    if (!removeSongFromAppReqRes.success) {
        app.throwError(`Can't remove song from app: ${removeSongFromAppReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshSongBuffer().then(async () => {
        await app.playlistManager.refreshPlaylistBuffer();
        app.playlistManager.refreshOpenedPlaylistTab();
        app.playlistManager.refreshPlaylistsContainerTab();
    });
    
    app.modalManager.openTopModal("SUCCESS", `Successfully removed song "${song.title}" by "${song.artist}" from Heko.`);
    return null;
}

export default function openRemoveFromAppSongModal(app: App, userSongs: Song[]): void {
    const songTitles: string[] = userSongs.map((song: Song) => song.title);

    const content: ModalRow[] = [
        { label: "Title", type: "SELECT", maxLength: 150, data: songTitles },
    ];

    const data: CenterModalData = {
        title: "Remove song from Heko",
        content: content,
        onConfirm: async (modal: CenterModal) => await removeSongFromAppModalOnConfirm(app, modal, userSongs),
        cantClose: false,
    };

    app.modalManager.openCenterModal(data);
}
