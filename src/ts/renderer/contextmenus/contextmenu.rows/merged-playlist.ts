import App from "./../../app.js";
import openRemoveMergedFromPlaylistModal from "./../../modals/modal.center.open/remove-merged-from-playlist.js";

function toggleOnClick(app: App, mergedPlaylist: Playlist): void {
    const mergedPlaylistElement: Element | null = document.querySelector(`.current-playlist-table-row[playlist-id="${mergedPlaylist.id}"]`);
    if (mergedPlaylistElement == null) {
        return app.throwError("Can't toggle playlist: Playlist element is null.");
    }

    const checkboxElement: Element | null = mergedPlaylistElement.querySelector("input[type='checkbox']");
    if (checkboxElement == null) {
        return app.throwError("Can't toggle playlist: Checkbox element is null.");
    }

    const realCheckboxElement: HTMLInputElement = (checkboxElement as HTMLInputElement);
    realCheckboxElement.checked = !realCheckboxElement.checked;
    realCheckboxElement.dispatchEvent(new Event("change"));
}

export function getMergedPlaylistRows(app: App, mergedPlaylist: Playlist): ContextmenuRow[] {
    const currentOpenedPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentOpenedPlaylist == null) {
        app.throwError("Can't get merged playlist rows: Current opened playlist is null.");
        return [];
    }
    
    return [
        { title: "Open", onClick: async () => {
            app.playlistManager.open(mergedPlaylist.id);
        }, disabled: false },

        { title: "Toggle", onClick: async () => toggleOnClick(app, mergedPlaylist), disabled: false },

        { title: "Remove from playlist", onClick: async () => {
            openRemoveMergedFromPlaylistModal(app, currentOpenedPlaylist, mergedPlaylist);
        }, disabled: false },
    ];
}
