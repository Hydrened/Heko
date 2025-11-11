import App from "./../app.js";
import * as Functions from "./../utils/utils.functions.js";
import "./../utils/utils.types.js";

export default class TopModal {
    private container: HTMLElement | null = null;

    constructor(private app: App, private type: TopModalType, private message: string) {
        this.open();
    }

    private open(): void {
        this.container = document.createElement("top-modal-container");
        this.container.classList.add(this.type.toLowerCase());
        this.container.textContent = this.message;
        document.body.appendChild(this.container);

        this.container.addEventListener("click", () => this.close());

        setTimeout(() => this.close(), 7000);
    }

    public close(): void {
        if (this.container == null) {
            return;
        }

        const closingDuration: number = ((this.app.settings.get().apparence.enableAnimations) ? Number(Functions.getCssVariable("top-modal-closing-duration", "MS_DURATION")) : 0);
        
        this.container.classList.add("closing");
        setTimeout(() => this.container?.remove(), closingDuration);
    }
};
