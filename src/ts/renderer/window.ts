import { ElectronApp } from "./app.js";
import Api from "./utils/utils.api.js";

export default class Window {
    private readonly minimizeWindowButton: Element = document.querySelector("#minimize-window-button")!;
    private readonly maximizeWindowButton: Element = document.querySelector("#maximize-window-button")!;
    private readonly closeWindowButton: Element = document.querySelector("#close-window-button")!;

    public constructor(private app: ElectronApp) {
        this.initEvents();
    }

    private initEvents(): void {
        if (this.minimizeWindowButton === null || this.maximizeWindowButton === null || this.closeWindowButton === null) {
            throw new Error(`Could not initialize frame buttons: A frame button is null.`);
        }

        this.minimizeWindowButton.addEventListener("click", async () => await Api.Window.minimize());
        this.maximizeWindowButton.addEventListener("click", async () => await Api.Window.maximize());
        this.closeWindowButton.addEventListener("click", async () => await Api.Window.close());
    }
};
