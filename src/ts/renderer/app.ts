import Window from "./window.js";
import Account from "./account.js";
import * as Bridge from "./utils/utils.bridge.js";
import "./utils/utils.types.js";

export default class App {
    private window: Window;
    private account: Account;
    
    private threw: boolean = false;

    constructor() {
        this.window = new Window(this);
        this.account = new Account(this);
    }

    public async init(): Promise<void> {
        await this.account.init();
    }

    public throwError(message: string): void {
        if (!this.threw) {
            Bridge.throwError(message);
            this.threw = true;
        }
    }

    public logError(message: string): void {
        console.error(message);
    }
};
