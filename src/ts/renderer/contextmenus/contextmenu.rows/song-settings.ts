import App from "./../../app.js";
import openAddSongFileToAppModal from "./../../modals/modal.center.open/add-song-file-to-app.js";
import openEditFromAppSongModal from "./../../modals/modal.center.open/edit-song-from-app.js";
import openRemoveFromAppSongModal from "./../../modals/modal.center.open/remove-song-from-app.js";
import openAddYoutubeSongToAppModal from "./../../modals/modal.center.open/add-youtube-song-to-app.js";

export function getSongSettingRows(app: App): ContextmenuRow[] {
    const userSongs: Song[] = app.playlistManager.getSongBuffer();
    const disableEditSongFromApp: boolean = (userSongs.length == 0);
    const disableRemoveSongFromApp: boolean = (userSongs.length == 0);

    return [
        { title: "Add song to Heko", rows: [
            { title: "Upload file", onClick: async () => {
                openAddSongFileToAppModal(app, userSongs);
            }, disabled: false },

            { title: "Search on youtube", onClick: async () => {
                openAddYoutubeSongToAppModal(app, userSongs);
            }, disabled: true },
        ], disabled: false },

        { title: "Edit song from Heko", onClick: async () => {
            openEditFromAppSongModal(app, userSongs);
        }, disabled: disableEditSongFromApp },

        { title: "Remove song from Heko", onClick: async () => {
            openRemoveFromAppSongModal(app, userSongs);
        }, disabled: disableRemoveSongFromApp },
    ];
}
