import App from "./../app.js";
import CenterModal from "./../modals/modal.center.js";

export default class ContextmenuRows {
    constructor(private app: App) {

    }

    public getPlaylistContainer(): ContextmenuRow[] {
        return [];
    }

    public async getPlaylistRows(playlist: Playlist): Promise<ContextmenuRow[]> {
        const movePlaylistInRows: ContextmenuRow[] = [];

        return [
            { title: "Rename playlist", shortcut: { ctrl: false, shift: false, alt: false, key: "F2" }, onClick: () => {
                // this.app.playlistManager.
            }, rows: null },
            { title: "Remove playlist", shortcut: { ctrl: false, shift: false, alt: false, key: "Suppr" }, onClick: () => {
                
            }, rows: null },
            { title: "Move playlist in", shortcut: null, onClick: null, rows: movePlaylistInRows },
        ];
    }

    public getSongSettingRows(): ContextmenuRow[] {
        const addSongModalData: CenterModalData = {
            title: "Add song to Heko",
            content: [
                { label: "", type: "TEXT", maxLength: 0, defaultValue: "", data: null },
            ],
            onConfirm: async () => { return null },
            onCancel: null,
            additionnalButtons: [],
            cantClose: false,
        };

        return [
            { title: "Add song to Heko", shortcut: null, onClick: () => {
                new CenterModal(this.app, addSongModalData);
            }, rows: null },
            { title: "Remove song from Heko", shortcut: null, onClick: () => {

            }, rows: null },
        ];
    }
};
