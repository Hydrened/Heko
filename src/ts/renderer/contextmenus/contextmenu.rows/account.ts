import App from "./../../app.js";

export function getAccountRows(app: App): ContextmenuRow[] {
    return [
        { title: "Settings", onClick: async () => {
            app.settings.open();
        }, disabled: false },

        { title: "Logout", onClick: async () => {
            await app.account.logout();
        }, disabled: false },
    ];
}
