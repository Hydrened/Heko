import App from "./../app.js";
import SettingsManager from "./settings.js";
import openEditAccountNameModal from "./../modals/modal.center.open/edit-account-name.js";
import openDeleteAccountModal from "./../modals/modal.center.open/remove-account.js";
import * as Elements from "./../utils/utils.elements.js";

export default class AccountSettingsManager {
    constructor(private app: App, private main: SettingsManager) {
        this.initEvents();
    }

    private initEvents(): void {
        Elements.settings.account.name.editButton.addEventListener("click", () => openEditAccountNameModal(this.app));
        Elements.settings.account.removeButton.addEventListener("click", () => openDeleteAccountModal(this.app));
    }

    public loggedIn(settings: Settings): void {
        const userData: UserData = this.app.account.getUserData();
        Elements.settings.account.name.text.textContent = userData.name!;
        Elements.settings.account.email.textContent = userData.email!;
    }
};
