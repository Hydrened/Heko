import App from "./app.js";
import openLoginModal from "./modals/modal.center.open/login.js";
import openRegisterModal from "./modals/modal.center.open/register.js";
import * as Bridge from "./utils/utils.bridge.js";
import * as Requests from "./utils/utils.requests.js";
import * as Elements from "./utils/utils.elements.js";

export default class Account {
    private modal: CenterModal | null = null;
    private userID: ID | null = null;
    private token: Token | null = null;
    private settings: UserSettings | null = null;
    private downloads: string[] = [];

    // INIT
    constructor(private app: App) {

    }

    public async init(): Promise<void> {
        this.initEvents();
        await this.checkLoginState();
    }

    private async checkLoginState(): Promise<void> {
        const token: Token = await Bridge.token.get();

        const validityReqRes: any = await Requests.user.isTokenValid(token);
        if (!validityReqRes.success) {
            if (validityReqRes.error == "Maintenance") {
                this.app.throwError(validityReqRes.error);
                return;
            }
            return this.openLoginModal();
        }

        const userID: ID = Number(validityReqRes.userID);

        this.userID = userID;
        this.token = token;

        await this.loggedIn();
    }

    private initEvents(): void {
        Elements.account.accountButton.addEventListener("click", () => {
            const rect: DOMRect = Elements.account.accountButton.getBoundingClientRect();
            this.app.contextmenuManager.createAccountContextmenu({ x: rect.x, y: rect.y });
        });
    }

    private async loadSettings(): Promise<void> {
        if (this.userID == null || this.token == null) {
            return;
        }

        const getUserSettingsReqRes: any = await Requests.user.getSettings(this.app);
        if (!getUserSettingsReqRes.success) {
            return this.app.throwError(`Can't get user settings: ${getUserSettingsReqRes.error}`);
        }

        this.settings = {
            userID: this.userID,
            shuffle: (getUserSettingsReqRes.settings.shuffle == 1),
            loop: (getUserSettingsReqRes.settings.loop == 1),
            speed: getUserSettingsReqRes.settings.speed,
            volume: getUserSettingsReqRes.settings.volume,
        };
    }

    private async loadDownloads(): Promise<void> {
        if (this.userID == null || this.token == null) {
            return;
        }

        const getUserDownloadsReqRes: any = await Requests.user.getDownloads(this.app);
        if (!getUserDownloadsReqRes.success) {
            return this.app.throwError(`Can't get user downloads: ${getUserDownloadsReqRes.error}`);
        }

        this.downloads = getUserDownloadsReqRes.downloads.map((row: any) => Object.values(row)).flat();
        console.log(this.downloads);
    }

    // LOG EVENTS
    public async loggedIn(): Promise<void> {
        if (this.userID == null || this.token == null) {
            return;
        }

        await this.loadSettings();
        await this.loadDownloads();
        await this.app.loggedIn();
    }

    public async logout(): Promise<void> {
        if (this.userID == null || this.token == null) {
            return;
        }

        await Bridge.token.remove();
        this.userID = null;
        this.token = null;

        this.openLoginModal();
        this.app.loggedOut();
    }

    // OPEN MODALS
    public openLoginModal(): void {
        if (this.modal != null) {
            this.modal.close();
        }

        this.modal = openLoginModal(this.app);
    }

    public openRegisterModal(): void {
        if (this.modal != null) {
            this.modal.close();
        }

        this.modal = openRegisterModal(this.app);
    }

    // GETTERS
    public getUserData(): UserData {
        return {
            id: this.userID,
            token: this.token,
        };
    }

    public getSettings(): UserSettings {
        return {
            userID: (this.settings ? this.settings.userID : -1),
            loop: (this.settings ? this.settings.loop : false),
            shuffle: (this.settings ? this.settings.shuffle : false),
            speed: (this.settings ? this.settings.speed : -1),
            volume: (this.settings ? this.settings.volume : -1),
        };
    }

    // SETTERS
    public setUserData(userID: ID, token: Token): void {
        this.userID = userID;
        this.token = token;
    }
};
