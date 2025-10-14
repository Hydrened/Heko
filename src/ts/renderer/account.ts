import App from "./app.js";
import CenterModal from "./modals/modal.center.js";
import * as Bridge from "./utils/utils.bridge.js";

export default class Account {
    modal: CenterModal | null = null;

    constructor(private app: App) {

    }

    public async init(): Promise<void> {
        await this.checkLoginState();
    }

    private async checkLoginState(): Promise<void> {
        const token: string = await Bridge.getToken();

        const validityRes: any = await this.sendTokenValidityRequest(token);
        if (!validityRes.success) {
            return this.openLoginModal();
        }

        const userID: number = Number(validityRes["user-id"]);
        console.log("Logged as user-id = " + userID);
    }

    private openLoginModal(): void {
        if (this.modal != null) {
            this.modal.close();
        }

        const content: ModalRow[] = [
            { label: "Email", type: "EMAIL", defaultValue: "", data: null },
            { label: "Password", type: "PASSWORD", defaultValue: "", data: null },
        ];

        const onConfirm: (res: ModalRes) => Promise<string> = async (res: ModalRes) => {
            const email: string = res[0].value;
            const password: string = res[1].value;

            const loginRes: any = await this.sendLoginRequest(email, password);
            if (!loginRes.success) {
                return loginRes.error;
            }
            
            await Bridge.saveToken(loginRes.token);
            return "";
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

        const onConfirm: (res: ModalRes) => Promise<string> = async (res: ModalRes) => {
            const name: string = res[0].value;
            const email: string = res[1].value;
            const password: string = res[2].value;
            const confirm: string = res[3].value;

            const registerRes: any = await this.sendRegisterRequest(name, email, password, confirm);
            if (!registerRes.success) {
                return registerRes.error;
            }

            const loginRes: any = await this.sendLoginRequest(email, password);
            if (!loginRes.success) {
                return loginRes.error;
            }

            await Bridge.saveToken(loginRes.token);
            return "";
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

    private async sendLoginRequest(email: string, password: string): Promise<any> {
        const res: Response = await fetch("https://killian-simon.fr/heko/login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                password: password,
            }),
        });

        return await res.json();
    }

    private async sendRegisterRequest(name: string, email: string, password: string, confirm: string): Promise<any> {
        const res: Response = await fetch("https://killian-simon.fr/heko/register.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                confirm: confirm,
            }),
        });

        return await res.json();
    }

    private async sendTokenValidityRequest(token: string): Promise<any> {
        const res: Response = await fetch("https://killian-simon.fr/heko/is-token-valid.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: token,
            }),
        });

        return await res.json();
    }
};
