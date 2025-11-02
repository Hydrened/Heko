import App from "./../../app.js";
import openAddMergeToPlaylistModal from "./../../modals/modal.center.open/add-merge-to-playlist.js";

function getPlaylistsLeft(app: App, mergeContainer: Playlist): Playlist[] {
    const alreadymergedPlaylistIDs: ID[] = mergeContainer.mergedPlaylist.map((mp: MergedPlaylist) => mp.id);

    return app.playlistManager.getPlaylistBuffer().filter((playlist: Playlist) => {
        const isNotMergeContainer: boolean = (playlist.mergedPlaylist.length == 0);
        const isNotParent: boolean = (playlist.children == 0);
        const isNotAlreadyIn: boolean = !alreadymergedPlaylistIDs.includes(playlist.id);

        return (isNotMergeContainer && isNotParent && isNotAlreadyIn);
    });
}

export function getMergedContainerShortcuts(): ShortcutMap {
    const res: ShortcutMap = {};
    res["add-playlist"] = { ctrl: true, shift: false, alt: false, key: "N" };
    return res;
}

export function getMergedContainerRows(app: App, mergeContainer: Playlist): ContextmenuRow[] {
    const playlistsLeft: Playlist[] = getPlaylistsLeft(app, mergeContainer);
    const disableAddPlaylist: boolean = (playlistsLeft.length == 0);

    const shortcuts: ShortcutMap = getMergedContainerShortcuts();

    return [
        { title: "Add playlist", shortcut: shortcuts["add-playlist"], onClick: async () => {
            openAddMergeToPlaylistModal(app, playlistsLeft);
        }, disabled: disableAddPlaylist },
    ];
}
