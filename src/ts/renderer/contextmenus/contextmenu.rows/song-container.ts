import App from "./../../app.js";
import openAddSongToPlaylistModal from "./../../modals/modal.center.open/add-song-to-playlist.js";

export function getSongContainerShortcuts(): ShortcutMap {
    const res: ShortcutMap = {};

    res["add-song"] = { ctrl: true, shift: false, alt: false, key: "N" };

    return res;
}

export async function getSongContainerRows(app: App): Promise<ContextmenuRow[]> {
    const songsLeft: Song[] = await app.playlistManager.getSongsLeft();
    const disableAddSong: boolean = (songsLeft.length == 0);

    const shortcuts: ShortcutMap = getSongContainerShortcuts();

    return [
        { title: "Add song", shortcut: shortcuts["add-song"], onClick: async () => {
            openAddSongToPlaylistModal(app, songsLeft);
        }, disabled: disableAddSong },
    ];
}
