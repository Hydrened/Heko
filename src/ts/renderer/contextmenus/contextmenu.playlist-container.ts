import App from "./../app.js";

export default function getPlaylistContainerRows(app: App, openModalCall: () => void): ContextmenuRow[] {
    return [
        { title: "Create playlist", shortcut: { ctrl: true, shift: true, alt: false, key: "N" }, onClick: async () => openModalCall(), disabled: false },
    ];
}
