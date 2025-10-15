import App from "./app.js";
import CenterModal from "./modals/modal.center.js";
import * as Bridge from "./utils/utils.bridge.js";
import * as Requests from "./utils/utils.requests.js";
import * as Elements from "./utils/utils.elements.js";

export default class Account {
    private modal: CenterModal | null = null;
    private userID: number | null = null;
    private token: string | null = null;

    constructor(private app: App) {

    }

    public async init(): Promise<void> {
        this.initEvents();
        await this.checkLoginState();
    }

    private initEvents(): void {
        Elements.account.logoutButton?.addEventListener("click", async () => await this.logout());
    }

    private async checkLoginState(): Promise<void> {
        const token: string = await Bridge.mainFolder.token.get();

        const validityRes: any = await Requests.user.isTokenValid(token);
        if (!validityRes.success) {
            return this.openLoginModal();
        }

        if (!validityRes.isValid) {
            return this.openLoginModal();
        }
        
        const userID: number = Number(validityRes.userID);

        this.userID = userID;
        this.token = token;

        this.logged();
    }

    private openLoginModal(): void {
        if (this.modal != null) {
            this.modal.close();
        }

        const content: ModalRow[] = [
            { label: "Email", type: "EMAIL", defaultValue: "", data: null },
            { label: "Password", type: "PASSWORD", defaultValue: "", data: null },
        ];

        const onConfirm: (res: ModalRes) => Promise<ModalError> = async (res: ModalRes) => {
            const email: string = res[0].value;
            const password: string = res[1].value;

            const loginRes: any = await Requests.user.login(email, password);
            if (!loginRes.success) {
                return loginRes.error;
            }
            
            await Bridge.mainFolder.token.save(loginRes.token);
            
            this.userID = Number(loginRes.userID);
            this.token = loginRes.token;
            this.logged();

            return null;
        };

        const additionnalButtons: ModalButton[] = [
            { title: "Register", onClick: () => this.openRegisterModal() },
        ];

        const modalData: CenterModalData = {
            title: "Login",
            content: content,
            onCancel: null,
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
            { label: "Name", type: "TEXT", defaultValue: "", data: null },
            { label: "Email", type: "EMAIL", defaultValue: "", data: null },
            { label: "Password", type: "PASSWORD", defaultValue: "", data: null },
            { label: "Confirm", type: "PASSWORD", defaultValue: "", data: null },
        ];

        const onConfirm: (res: ModalRes) => Promise<ModalError> = async (res: ModalRes) => {
            const name: string = res[0].value;
            const email: string = res[1].value;
            const password: string = res[2].value;
            const confirm: string = res[3].value;

            const registerRes: any = await Requests.user.register(name, email, password, confirm);
            if (!registerRes.success) {
                return registerRes.error;
            }

            const loginRes: any = await Requests.user.login(email, password);
            if (!loginRes.success) {
                return loginRes.error;
            }

            await Bridge.mainFolder.token.save(loginRes.token);

            this.userID = Number(loginRes.userID);
            this.token = loginRes.token;
            this.logged();

            return null;
        };

        const additionnalButtons: ModalButton[] = [
            { title: "Login", onClick: () => this.openLoginModal() },
        ];

        const modalData: CenterModalData = {
            title: "Register",
            content: content,
            onCancel: null,
            onConfirm: onConfirm,
            additionnalButtons: additionnalButtons,
            cantClose: true,
        };

        this.modal = new CenterModal(this.app, modalData);
    }

    private async logged(): Promise<void> {
        if (this.userID == null || this.token == null) {
            return;
        }

        this.app.playlists.refresh();

        console.log(`Logged as userID = ${this.userID} and token = ${this.token}`);
    }

    private async logout(): Promise<void> {
        await Bridge.mainFolder.token.remove();
        this.openLoginModal();
    }

    public getUserData(): UserData {
        return {
            id: this.userID,
            token: this.token,
        };
    }
};
