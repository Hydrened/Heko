import App from "./../app.js";
import * as Functions from "./../utils/utils.functions.js";

export default class LoadingModal {
    private container: HTMLElement | null = null;

    constructor(private app: App, private title: string) {
        this.open();
    }

    private open(): void {
        this.container = document.createElement("loading-modal-container");
        this.container.classList.add("modal");
        document.body.appendChild(this.container);

        const titleElement: HTMLElement = document.createElement("h1");
        titleElement.textContent = this.title;
        this.container.appendChild(titleElement);

        const spinnerElement: HTMLElement = document.createElement("div");
        spinnerElement.classList.add("loading-spinner");
        this.container.appendChild(spinnerElement);
    }

    public close(): void {
        if (this.container == null) {
            return;
        }

        const container: HTMLElement = this.container;
        container.classList.add("closing");

        const closingDuration: number = ((this.app.settings.get().apparence.enableAnimations) ? Number(Functions.getCssVariable("loading-modal-closing-duration", "MS_DURATION")) : 0);
        setTimeout(() => container.remove(), closingDuration);
    }

    public setTitle(title: string): void {
        if (this.container == null) {
            return;
        }

        const currentLoadingModalTitleElement: HTMLElement | null = this.container.querySelector("h1");
        if (currentLoadingModalTitleElement == null) {
            return;
        }

        currentLoadingModalTitleElement.textContent = title;
    }
};
