import App from "./app.js";
import CenterModal from "./modals/modal.center.js";
import ModalTop from "./modals/modal.top.js";
import * as Bridge from "./utils/utils.bridge.js";
import * as Requests from "./utils/utils.requests.js";
import * as Elements from "./utils/utils.elements.js";

export default class Account {
    private modal: CenterModal | null = null;
    private userID: ID | null = null;
    private token: Token | null = null;
    private settings: UserSettings | null = null;

    // INIT
    constructor(private app: App) {

    }

    public async init(): Promise<void> {
        this.initEvents();
        await this.checkLoginState();
    }

    private async checkLoginState(): Promise<void> {
        const token: Token = await Bridge.mainFolder.token.get();

        const validityRes: any = await Requests.user.isTokenValid(token);
        if (!validityRes.success) {
            return this.openLoginModal();
        }

        const userID: ID = Number(validityRes.userID);

        this.userID = userID;
        this.token = token;

        this.loggedIn();
    }

    private initEvents(): void {
        if (Elements.account.logoutButton == null) {
            return this.app.throwError("Can't init count events: Logout button element is null.");
        }

        Elements.account.logoutButton.addEventListener("click", async () => await this.loggedOut());
    }

    private async loadSettings(): Promise<any> {
        if (this.userID == null || this.token == null) {
            return;
        }

        const getUserSettingsReqRes: any = await Requests.user.getSettings(this.userID, this.token);
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

    // LOG EVENTS
    private async loggedIn(): Promise<void> {
        if (this.userID == null || this.token == null) {
            return;
        }

        const playlists: Playlist[] = await this.app.playlistManager.getSortedPlaylists();

        const firstSongPlaylist: Playlist | undefined = playlists[playlists.findIndex((playlist: Playlist) => playlist.children == 0)];
        if (firstSongPlaylist != undefined) {
            await this.app.playlistManager.open(firstSongPlaylist.id);
        }
        
        await this.loadSettings();
        await this.app.playlistManager.refresh();

        await this.app.loggedIn();
    }

    private async loggedOut(): Promise<void> {
        if (this.userID == null || this.token == null) {
            return;
        }

        await Bridge.mainFolder.token.remove();
        this.userID = null;
        this.token = null;

        await this.app.playlistManager.refresh();
        this.openLoginModal();

        await this.app.loggedOut();
    }

    // OPEN MODALS
    private openLoginModal(): void {
        if (this.modal != null) {
            this.modal.close();
        }

        const content: ModalRow[] = [
            { label: "Email", type: "EMAIL", maxLength: 150 },
            { label: "Password", type: "PASSWORD", maxLength: 150 },
        ];

        const onConfirm = async (res: ModalRes): Promise<ModalError> => {
            const email: string = res.rows["Email"].value;
            const password: string = res.rows["Password"].value;

            const loginReqRes: any = await Requests.user.login(email, password);
            if (!loginReqRes.success) {
                return {
                    error: loginReqRes.error,
                };
            }
            
            await Bridge.mainFolder.token.save(loginReqRes.token);

            this.userID = Number(loginReqRes.userID);
            this.token = loginReqRes.token;
            this.loggedIn();

            return null;
        };

        const additionnalButtons: ModalButton[] = [
            { title: "Register", onClick: () => this.openRegisterModal() },
        ];

        const modalData: CenterModalData = {
            title: "Login",
            content: content,
            onConfirm: onConfirm,
            additionnalButtons: additionnalButtons,
            cantClose: true,
        };

        this.modal = new CenterModal(this.app, modalData);
    }

    private openRegisterModal(): void {
        if (this.modal != null) {
            this.modal.close();
        }

        const content: ModalRow[] = [
            { label: "Name", type: "TEXT", maxLength: 150 },
            { label: "Email", type: "EMAIL", maxLength: 150 },
            { label: "Password", type: "PASSWORD", maxLength: 150 },
            { label: "Confirm", type: "PASSWORD", maxLength: 150 },
        ];

        const onConfirm = async (res: ModalRes): Promise<ModalError> => {
            const name: string = res.rows["Name"].value;
            const email: string = res.rows["Email"].value;
            const password: string = res.rows["Password"].value;
            const confirm: string = res.rows["Confirm"].value;

            const registerReqRes: any = await Requests.user.register(name, email, password, confirm);
            if (!registerReqRes.success) {
                return {
                    error: registerReqRes.error,
                };
            }

            const loginReqRes: any = await Requests.user.login(email, password);
            if (!loginReqRes.success) {
                return {
                    error: loginReqRes.error,
                };
            }

            await Bridge.mainFolder.token.save(loginReqRes.token);

            this.userID = Number(loginReqRes.userID);
            this.token = loginReqRes.token;
            this.loggedIn();

            ModalTop.create("SUCCESS", "Account successfully created.");

            return null;
        };

        const additionnalButtons: ModalButton[] = [
            { title: "Login", onClick: () => this.openLoginModal() },
        ];

        const modalData: CenterModalData = {
            title: "Register",
            content: content,
            onConfirm: onConfirm,
            additionnalButtons: additionnalButtons,
            cantClose: true,
        };

        this.modal = new CenterModal(this.app, modalData);
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
};
