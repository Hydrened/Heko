import App from "./../../app.js";
import openCreatePlaylistModal from "./../../modals/modal.center.open/create-playlist.js";

export function getPlaylistContainerRows(app: App): ContextmenuRow[] {
    return [
        { title: "Create playlist", shortcut: { ctrl: true, shift: true, alt: false, key: "N" }, onClick: async () => {
            openCreatePlaylistModal(app);
        }, disabled: false },
    ];
}
