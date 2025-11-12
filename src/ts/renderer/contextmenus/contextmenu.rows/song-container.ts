import App from "./../../app.js";
import openAddSongsToPlaylistModal from "./../../modals/modal.center.open/add-songs-to-playlist.js";

export function getSongContainerShortcuts(): ShortcutMap {
    const res: ShortcutMap = {};
    res["add-songs"] = { ctrl: true, shift: false, alt: false, key: "N" };
    return res;
}

export function getSongContainerRows(app: App): ContextmenuRow[] {
    const songsLeft: Song[] = app.playlistManager.getPlaylistSongsLeft();
    const disableAddSongs: boolean = (songsLeft.length == 0);

    const shortcuts: ShortcutMap = getSongContainerShortcuts();

    return [
        { title: "Add songs", shortcut: shortcuts["add-songs"], onClick: async () => {
            openAddSongsToPlaylistModal(app, songsLeft);
        }, disabled: disableAddSongs },
    ];
}
