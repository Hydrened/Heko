import App from "./app.js";
import CenterModal from "./modals/modal.center.js";
import * as Bridge from "./utils/utils.bridge.js";
import * as Requests from "./utils/utils.requests.js";
import * as Elements from "./utils/utils.elements.js";

export default class Account {
    private modal: CenterModal | null = null;
    private userID: ID | null = null;
    private token: Token | null = null;

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
        if (Elements.playlists.container == null) {
            return this.app.throwError("Can't log: Playlist container element is null.");
        }

        if (Elements.currentPlaylist.songContainer == null) {
            return this.app.throwError("Can't log: Table body element is null.");
        }

        Elements.playlists.container.classList.add("loading");
        Elements.currentPlaylist.songContainer.classList.add("loading");

        const token: Token = await Bridge.mainFolder.token.get();

        const validityRes: any = await Requests.user.isTokenValid(token);
        if (!validityRes.success) {
            return this.openLoginModal();
        }

        const userID: ID = Number(validityRes.userID);

        this.userID = userID;
        this.token = token;

        this.logged();
    }

    private openLoginModal(): void {
        if (this.modal != null) {
            this.modal.close();
        }

        const content: ModalRow[] = [
            { label: "Email", type: "EMAIL", maxLength: 150 },
            { label: "Password", type: "PASSWORD", maxLength: 150 },
        ];

        const onConfirm = async (res: ModalRes): Promise<ModalError> => {
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
            onConfirm: onConfirm,
            additionnalButtons: additionnalButtons,
            cantClose: true,
        };

        this.modal = new CenterModal(this.app, modalData);
    }

    private async logged(): Promise<void> {
        if (Elements.playlists.container == null) {
            return this.app.throwError("Can't log: Playlist container element is null.");
        }

        if (Elements.currentPlaylist.songContainer == null) {
            return this.app.throwError("Can't log: Table body element is null.");
        }

        Elements.playlists.container.classList.remove("loading");
        Elements.currentPlaylist.songContainer.classList.remove("loading");

        if (this.userID == null || this.token == null) {
            return;
        }

        await this.app.playlistManager.refresh();

        const firstPlaylistElement: HTMLElement | null = document.querySelector("li.playlist-wrapper:has(> .children-container:empty)");
        if (firstPlaylistElement == null) {
            return;
        }

        const firstPlaylistID: number = Number(firstPlaylistElement.getAttribute("playlist-id"));
        if (isNaN(firstPlaylistID)) {
            return;
        }

        await this.app.playlistManager.open(firstPlaylistID);
    }

    private async logout(): Promise<void> {
        if (this.userID == null || this.token == null) {
            return;
        }

        await Bridge.mainFolder.token.remove();
        this.userID = null;
        this.token = null;

        this.app.playlistManager.refresh();
        this.openLoginModal();
    }

    public getUserData(): UserData {
        return {
            id: this.userID,
            token: this.token,
        };
    }
};
