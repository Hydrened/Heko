import App from "./../../app.js";

export function getAccountShortcuts(): ShortcutMap {
    const res: ShortcutMap = {};
    res["settings"] = { ctrl: true, shift: false, alt: false, key: "," };
    res["logout"] = { ctrl: true, shift: false, alt: false, key: "L" };
    return res;
}

export function getAccountRows(app: App): ContextmenuRow[] {
    const shortcuts: ShortcutMap = getAccountShortcuts();

    return [
        { title: "Settings", shortcut: shortcuts["settings"], onClick: async () => {
            app.settings.open();
        }, disabled: false },

        { title: "Logout", shortcut: shortcuts["logout"], onClick: async () => {
            await app.account.logout();
        }, disabled: false },
    ];
}
