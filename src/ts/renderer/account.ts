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
    private name: string | null = null;
    private email: string | null = null;

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
        this.name = validityReqRes.name;
        this.email = validityReqRes.email;

        await this.loggedIn();
    }

    private initEvents(): void {
        Elements.account.accountButton.addEventListener("click", () => {
            const rect: DOMRect = Elements.account.accountButton.getBoundingClientRect();
            this.app.contextmenuManager.createAccountContextmenu({ x: rect.x, y: rect.y });
        });
    }

    private async loadDownloads(): Promise<void> {
        if (!this.isLoggedIn()) {
            return;
        }

        // const getUserDownloadsReqRes: any = await Requests.user.getDownloads(this.app);
        // if (!getUserDownloadsReqRes.success) {
        //     return this.app.throwError(`Can't get user downloads: ${getUserDownloadsReqRes.error}`);
        // }

        // this.downloads = getUserDownloadsReqRes.downloads.map((row: any) => Object.values(row)).flat();
    }

    // LOG EVENTS
    public async loggedIn(): Promise<void> {
        if (!this.isLoggedIn()) {
            return;
        }

        await this.app.loggedIn();
        await this.loadDownloads();
    }

    public async logout(): Promise<void> {
        if (!this.isLoggedIn()) {
            return;
        }

        await this.app.loggedOut();

        await Bridge.token.remove();
        this.userID = null;
        this.token = null;
        this.name = null;
        this.email = null;

        this.openLoginModal();
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
    public isLoggedIn(): boolean {
        return (this.userID != null && this.token != null && this.name != null && this.email != null);
    }

    public getUserData(): UserData {
        return {
            id: this.userID,
            token: this.token,
            name: this.name,
            email: this.email,
        };
    }
    
    // SETTERS
    public setUserData(userID: ID, token: Token, name: string, email: string): void {
        this.userID = userID;
        this.token = token;
        this.name = name;
        this.email = email;
    }
};
