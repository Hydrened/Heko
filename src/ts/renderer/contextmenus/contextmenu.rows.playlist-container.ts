import App from "./../app.js";

function getMovePlaylistInRows(playlist: Playlist): ContextmenuRow[] {
    return [];
}

export default async function getPlaylistRows(app: App, playlist: Playlist): Promise<ContextmenuRow[]> {
    return [

        { title: "Rename playlist", shortcut: { ctrl: false, shift: false, alt: false, key: "F2" }, onClick: async () => {
            
        }, rows: null },

        { title: "Remove playlist", shortcut: { ctrl: false, shift: false, alt: false, key: "Suppr" }, onClick: async () => {
            
        }, rows: null },

        { title: "Move playlist in", shortcut: null, onClick: null, rows: getMovePlaylistInRows(playlist) },
        
    ];
}
