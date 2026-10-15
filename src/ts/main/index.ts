import WindowManager from "./window.js";
import Api from "./api/api.js";
import { app } from "electron";

class Index {
    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        const window: WindowManager = new WindowManager({});
        const api: Api = new Api(window);
    }
};  

app.whenReady().then(() => new Index());
