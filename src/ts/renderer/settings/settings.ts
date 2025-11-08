import App from "./../app.js";
import * as Elements from "./../utils/utils.elements.js";

export default class Settings {
    private isOpened: boolean = false;

    constructor(private app: App) {
        this.initEvents();
    }

    private initEvents(): void {
        document.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key == "Escape" && this.isOpened) {
                this.close();
            }
        });
    }

    public open(): void {
        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return;
        }

        this.isOpened = true;
        Elements.settings.container.classList.remove("hidden");
    }

    private close(): void {
        this.isOpened = false;
        Elements.settings.container.classList.add("hidden");
    }
};
