import App from "./../app.js";

export default class CenterModal {
    public container: HTMLElement | null = null;

    constructor(private app: App, private data: CenterModalData) {
        const container: HTMLElement = this.createContainer();
        this.createContent(container);
        this.createFooter(container);
    }

    private createContainer(): HTMLElement {
        this.container = document.createElement("div");
        this.container.classList.add("center-modal-container");
        document.body.appendChild(this.container);

        if (!this.data.cantClose) {
            this.container.addEventListener("mousedown", (e: MouseEvent) => {
                if (e.target == this.container) {
                    this.close();
                }
            });
        }

        const modal: HTMLElement = document.createElement("div");
        modal.classList.add("center-modal");
        this.container.appendChild(modal);

        if (!this.data.cantClose) {
            const closeButton: HTMLElement = document.createElement("button");
            closeButton.classList.add("close-button"),
            modal.appendChild(closeButton);
            const crossImg: HTMLImageElement = document.createElement("img");
            crossImg.src = "assets/remove.svg";
            closeButton.appendChild(crossImg);

            closeButton.addEventListener("click", () => this.close());
        }

        const h1: HTMLElement = document.createElement("h1");
        h1.textContent = this.data.title;
        modal.appendChild(h1);

        const container: HTMLElement = document.createElement("div");
        container.classList.add("container");
        modal.appendChild(container);

        return container;
    }

    private createContent(container: HTMLElement): void {
        if (this.data.content.length == 0) {
            return
        }

        const ul: HTMLElement = document.createElement("ul");
        ul.classList.add("field-container");
        container.appendChild(ul);

        this.data.content.forEach((row: ModalRow) => this.createRow(ul, row));
        this.focusFirstField();
    }

    private createRow(ul: HTMLElement, row: ModalRow): void {
        const li: HTMLElement = document.createElement("li");
        ul.appendChild(li);

        const label: HTMLElement = document.createElement("label");
        label.textContent = `${row.label} :`;
        li.appendChild(label);

        const input: HTMLInputElement = document.createElement("input");
        input.type = row.type.toLowerCase();
        input.value = row.defaultValue;
        li.appendChild(input);

        input.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key.length > 1 || e.key == ' ' || e.key == '@' || e.key == '.') {
                return;
            }

            if (!/^[a-z0-9]$/i.test(e.key)) {
                e.preventDefault();
            }
        });
    }

    private createFooter(container: HTMLElement): void {
        const buttonContainer: HTMLElement = document.createElement("div");
        buttonContainer.classList.add("button-container");
        container.appendChild(buttonContainer);

        const confirmButton: HTMLElement = document.createElement("button");
        confirmButton.textContent = "Confirm";
        confirmButton.classList.add("confirm-button");
        buttonContainer.appendChild(confirmButton);
        
        confirmButton.addEventListener("click", async () => await this.confirm());

        this.data.additionnalButtons.forEach((button: ModalButton) => {
            const buttonElement: HTMLElement = document.createElement("button");
            buttonElement.textContent = button.title;
            buttonContainer.appendChild(buttonElement);

            buttonElement.addEventListener("click", () => button.onClick());
        });

        if (!this.data.cantClose) {
            const cancelButton: HTMLElement = document.createElement("button");
            cancelButton.textContent = "Cancel";
            cancelButton.classList.add("cancel-button");
            buttonContainer.appendChild(cancelButton);

            cancelButton.addEventListener("click", () => this.close());
        }
    }

    public async confirm(): Promise<boolean> {
        if (!this.container) {
            return false;
        }

        const res: ModalRes = [...this.container.querySelectorAll(".field-container > li")].map((li: Element) => {
            
            const label: HTMLElement | null = li.querySelector("label");
            const input: HTMLInputElement | null = li.querySelector("input");

            if (label && input) {
                return {
                    label: label.textContent.slice(0, -2),
                    value: input.value,
                };
            }

            return { label: "", value: "" };
        });

        const err: string | undefined = await this.data.onConfirm(res);
        if (err != "" && err != undefined) {
            this.focusFirstField();
            this.app.logError(err);
            return false;
        }

        this.close();
        return true;
    }

    public close(): void {
        if (!this.container) {
            return this.app.throwError("Can't close modal: Container is null.");
        }

        this.container.remove();

        if (this.data.onCancel) {
            this.data.onCancel();
        }
    }

    private focusFirstField(): void {
        if (!this.container) {  
            return this.app.throwError("Can't close modal: Container is null.");
        }

        const input: HTMLElement | null = this.container.querySelector("input");
        if (!input) {
            return this.app.throwError("Can't focus first modal field: Input is null.");
        }
        
        input.focus();
    }
};
