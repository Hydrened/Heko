import App from "./../../app.js";
import openAddSongToAppModal from "./../../modals/modal.center.open/add-song-to-app.js";
import openEditFromAppSongModal from "./../../modals/modal.center.open/edit-song-from-app.js";
import openRemoveFromAppSongModal from "./../../modals/modal.center.open/remove-song-from-app.js";

export function getSongSettingRows(app: App): ContextmenuRow[] {
    const userSongs: Song[] = app.playlistManager.getSongBuffer();
    const disableEditSongFromApp: boolean = (userSongs.length == 0);
    const disableRemoveSongFromApp: boolean = (userSongs.length == 0);

    return [
        { title: "Add song to Heko", onClick: async () => {
            openAddSongToAppModal(app, userSongs);
        }, disabled: false },

        { title: "Edit song from Heko", onClick: async () => {
            openEditFromAppSongModal(app, userSongs);
        }, disabled: disableEditSongFromApp },

        { title: "Remove song from Heko", onClick: async () => {
            openRemoveFromAppSongModal(app, userSongs);
        }, disabled: disableRemoveSongFromApp },
    ];
}
