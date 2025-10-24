import "./../utils/utils.types.js";

export default class TopModal {
    private container: HTMLElement | null = null;

    // INIT
    private constructor(private type: TopModalType, private message: string) {
        this.open();
    }

    public static create(type: TopModalType, message: string): void {
        new TopModal(type, message);
    }

    // EVENTS
    private open(): void {
        this.container = document.createElement("top-modal-container");
        this.container.classList.add(this.type.toLowerCase());
        this.container.textContent = this.message;
        document.body.appendChild(this.container);

        this.container.addEventListener("click", () => this.close());

        setTimeout(() => this.close(), 7000);
    }

    private close(): void {
        if (this.container == null) {
            return;
        }

        this.container.classList.add("closing");
        setTimeout(() => this.container?.remove(), 500);
    }
};
