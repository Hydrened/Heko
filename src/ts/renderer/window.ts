import App from "./app.js";
import * as Bridge from "./utils/utils.bridge.js";

export default class Window {
    private minimizeWindowButton: HTMLElement | null = document.querySelector("#minimize-window-button");
    private maximizeWindowButton: HTMLElement | null = document.querySelector("#maximize-window-button");
    private closeWindowButton: HTMLElement | null = document.querySelector("#close-window-button");

    constructor(private app: App) {
        this.initEvents();
    }

    private initEvents(): void {
        if (!this.minimizeWindowButton || !this.maximizeWindowButton || !this.closeWindowButton) {
            return this.app.throwError("Can't initialize frame buttons.");
        }

        const win = (window as any);

        this.minimizeWindowButton.addEventListener("click", async () => await Bridge.minimizeWindow());
        this.maximizeWindowButton.addEventListener("click", async () => await Bridge.maximizeWindow());
        this.closeWindowButton.addEventListener("click", async () => await Bridge.closeWindow());
    }
};