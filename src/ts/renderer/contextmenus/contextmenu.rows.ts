import "./../utils/utils.types.js";

export function getPlaylistRows(playlist: Playlist): ContextmenuRow[] {
    return [
        { title: "Rename", shortcut: null, onClick: () => {

        }, content: null },
        { title: "Remove", shortcut: null, onClick: () => {
            
        }, content: null },
    ];
};
