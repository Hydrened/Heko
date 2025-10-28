import App from "./../../app.js";
import openAddSongToAppModal from "./../../modals/modal.center.open/add-song-to-app.js";
import openEditFromAppSongModal from "./../../modals/modal.center.open/edit-song-from-app.js";
import openRemoveFromAppSongModal from "./../../modals/modal.center.open/remove-song-from-app.js";
import * as Requests from "./../../utils/utils.requests.js";

export async function getSongSettingRows(app: App): Promise<ContextmenuRow[]> {
    const errorBase: string = "Can't get song settings contextmenu rows";

    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        app.throwError(`${errorBase}: User is not logged in.`);
        return [];
    }

    const songsFromUserReqRes: any = await Requests.song.getAllFromUser(userData.id, userData.token);
    if (!songsFromUserReqRes.success) {
        app.throwError(`${errorBase}: ${songsFromUserReqRes.error}`);
        return [];
    }

    const userSongs: Song[] = (songsFromUserReqRes.songs as Song[]);
    const disableEditSongFromApp: boolean = (userSongs.length == 0);
    const disableRemoveSongFromApp: boolean = (userSongs.length == 0);

    return [
        { title: "Add song to Heko", onClick: async () => {
            await openAddSongToAppModal(app, userSongs);
        }, disabled: false },

        { title: "Edit song from Heko", onClick: async () => {
            await openEditFromAppSongModal(app, userSongs);
        }, disabled: disableEditSongFromApp },

        { title: "Remove song from Heko", onClick: async () => {
            openRemoveFromAppSongModal(app, userSongs);
        }, disabled: disableRemoveSongFromApp },
    ];
}
