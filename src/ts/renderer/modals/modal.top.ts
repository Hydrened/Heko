import "./../utils/utils.types.js";

export default class ModalTop {
    private container: HTMLElement | null = null;

    private constructor(private type: TopModalType, private message: string) {
        this.open();
    }

    public static create(type: TopModalType, message: string): void {
        new ModalTop(type, message);
    }

    private open(): void {
        this.container = document.createElement("top-modal-container");
        this.container.classList.add(this.type.toLowerCase());
        this.container.textContent = this.message;
        document.body.appendChild(this.container);

        this.container.addEventListener("click", () => this.close());

        setTimeout(() => this.close(), 5000);
    }

    private close(): void {
        if (this.container == null) {
            return;
        }

        this.container.classList.add("closing");
        setTimeout(() => this.container?.remove(), 500);
    }
};
