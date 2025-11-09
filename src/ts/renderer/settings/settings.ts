import App from "./../app.js";
import AccountSettings from "./settings.account.js";
import ApparenceSettings from "./settings.apparence.js";
import PreferencesSettings from "./settings.preferences.js";
import * as Elements from "./../utils/utils.elements.js";

export default class Settings {
    public readonly account: AccountSettings;
    public readonly apparence: ApparenceSettings;
    public readonly preferences: PreferencesSettings;

    private isOpened: boolean = false;

    constructor(private app: App) {
        this.account = new AccountSettings(this.app, this);
        this.apparence = new ApparenceSettings(this.app, this);
        this.preferences = new PreferencesSettings(this.app, this);

        this.initEvents();
    }

    private initEvents(): void {
        document.addEventListener("keydown", (e: KeyboardEvent) => {
            const isAModalOpened: boolean = (this.app.modalManager.getCurrentModalContainer() != null);

            if (e.key == "Escape" && this.isOpened && !isAModalOpened) {
                this.close();
            }
        });

        window.addEventListener("wheel", (e: WheelEvent) => {
            if (!this.isOpened) {
                return;
            }

            e.preventDefault();

            Elements.settings.sectionContainer.scrollTop += e.deltaY;
        }, { passive: false});
    }

    public loggedIn(): void {
        this.account.loggedIn();
        this.apparence.loggedIn();
        this.preferences.loggedIn();
    }

    public open(): void {
        const userData: UserData = this.app.account.getUserData();
        if (!this.app.account.loggedIn()) {
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
