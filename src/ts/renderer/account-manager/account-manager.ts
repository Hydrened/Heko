import Api from "./../utils/utils.api.js";
import { App } from "./../app.js";
import * as Create from "./../utils/utils.create.js";

export default class AccountManager {
    // INIT
    public constructor(private readonly app: App) {}

    // OTHER
    private async openLoginRegisterModal(): Promise<void> {
        while (!await Create.LoginRegisterModal.open()) {}
    }

    private async isLogged(): Promise<boolean> {
        const isLoggedReqRes: IsLoggedApiResult = await Api.User.isLogged();
        return isLoggedReqRes.success;
    }

    // PUBLIC
    public async init(): Promise<void> {
        const isLogged: boolean = await this.isLogged();
        if (!isLogged) {
            await this.openLoginRegisterModal();
        }
    }

    public async logout(): Promise<void> {
        
    }
};
