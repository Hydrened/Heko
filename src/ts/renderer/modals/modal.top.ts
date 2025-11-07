import * as Functions from "./../utils/utils.functions.js";
import "./../utils/utils.types.js";

export default class TopModal {
    private container: HTMLElement | null = null;

    constructor(private type: TopModalType, private message: string) {
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

        this.container.classList.add("closing");
        setTimeout(() => this.container?.remove(), Number(Functions.getCssVariable("top-modal-closing-duration", "MS_DURATION")));
    }
};
