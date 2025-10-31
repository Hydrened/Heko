import App from "./app.js";
import * as Bridge from "./utils/utils.bridge.js";

export default class Window {
    private minimizeWindowButton: Element = document.querySelector("#minimize-window-button")!;
    private maximizeWindowButton: Element = document.querySelector("#maximize-window-button")!;
    private closeWindowButton: Element = document.querySelector("#close-window-button")!;

    constructor(private app: App) {
        this.initEvents();
    }

    private initEvents(): void {
        if (this.minimizeWindowButton == null || this.maximizeWindowButton == null || this.closeWindowButton == null) {
            return this.app.throwError("Can't initialize frame buttons.");
        }

        this.minimizeWindowButton.addEventListener("click", async () => await Bridge.win.minimize());
        this.maximizeWindowButton.addEventListener("click", async () => await Bridge.win.maximize());
        this.closeWindowButton.addEventListener("click", async () => await Bridge.win.close());
    }
};
