import App from "./../../app.js";
import openCreatePlaylistModal from "./../../modals/modal.center.open/create-playlist.js";

export function getPlaylistContainerShortcuts(): ShortcutMap {
    const res: ShortcutMap = {};
    res["create-playlist"] = { ctrl: true, shift: true, alt: false, key: "N" };
    return res;
}

export function getPlaylistContainerRows(app: App): ContextmenuRow[] {
    const shortcuts: ShortcutMap = getPlaylistContainerShortcuts();

    return [
        { title: "Create playlist", shortcut: shortcuts["create-playlist"], onClick: async () => {
            openCreatePlaylistModal(app);
        }, disabled: false },
    ];
}
