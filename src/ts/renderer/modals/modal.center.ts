import App from "./../app.js";
import InputSelect from "./../utils/utils.input-select.js";
import * as AntiSpam from "./../utils/utils.anti-spam.js";
import * as Functions from "./../utils/utils.functions.js";

export default class CenterModal {
    protected mainContainer: HTMLElement | null = null;
    protected container: HTMLElement | null = null;
    private closing: boolean = false;
    private closingDuration: number = 0;

    // INIT
    constructor(protected app: App, private data: CenterModalData) {
        this.checkErrors();
        this.initEvents();
        this.loadCssVariables();

        this.createContainer();
        this.createContent();
        this.createFooter();
    }

    private checkErrors(): void {
        if (this.data.content == undefined) {
            return;
        }

        this.data.content.reduce((acc: string[], row: ModalRow) => {
            if (acc.includes(row.label)) {
                this.app.throwError("Can't create center modal: Modal contains fields with same name.");
            }
            
            acc.push(row.label);
            return acc;
        }, []);
    }

    private initEvents(): void {
        window.addEventListener("keydown", this.keydownEvent);
    }

    private loadCssVariables(): void {
        this.closingDuration = Number(Functions.getCssVariable("center-modal-closing-duration", "MS_DURATION"));
    }

    private keydownEvent = async (e: KeyboardEvent): Promise<void> => {
        if (this.mainContainer != this.app.modalManager.getCurrentModalContainer()) {
            return;
        }

        if (e.key == "Escape") {
            if (this.mainContainer == null) {
                return this.app.throwError("Can't close modal: Container element is null.");
            }

            const inSelectInput: boolean = [...this.mainContainer.querySelectorAll("input-select > input")].some((e: Element) => document.activeElement == e);
            if (inSelectInput) {
                return;
            }

            if (!this.data.cantClose) {
                this.close();
            }
        }
        else if (e.key == "Enter") {
            const element: HTMLElement = (e.target as HTMLElement);
            if (element.tagName == "INPUT") {
                const isFileInput: boolean = ((element as HTMLInputElement).type == "file");
                const isInputSelect: boolean = element.classList.contains("input-select");

                if (isFileInput || isInputSelect) {
                    return;
                }
            }

            await AntiSpam.prevent(this.confirm());
        }
    }

    private createContainer(): void {
        this.mainContainer = document.createElement("div");
        this.mainContainer.classList.add("center-modal-container");
        this.mainContainer.classList.add("modal");
        document.body.appendChild(this.mainContainer);

        if (!this.data.cantClose) {
            this.mainContainer.addEventListener("mousedown", (e: MouseEvent) => {
                if (e.target == this.mainContainer) {
                    this.close();
                }
            });
        }

        const modal: HTMLElement = document.createElement("div");
        modal.classList.add("center-modal");
        this.mainContainer.appendChild(modal);

        if (!this.data.cantClose) {
            const closeButton: HTMLElement = document.createElement("button");
            closeButton.classList.add("close-button"),
            closeButton.setAttribute("tabindex", "-1");
            modal.appendChild(closeButton);
            const crossImg: HTMLImageElement = document.createElement("img");
            crossImg.src = "assets/remove.svg";
            closeButton.appendChild(crossImg);

            closeButton.addEventListener("click", () => this.close());
        }

        const h1: HTMLElement = document.createElement("h1");
        h1.textContent = this.data.title;
        modal.appendChild(h1);

        this.container = document.createElement("div");
        this.container.classList.add("container");
        modal.appendChild(this.container);
    }

    protected createContent(): void {
        if (this.container == null) {
            return this.app.throwError("Can't create modal content: Container element is null.");
        }

        if (this.data.content == undefined) {
            return;
        }

        if (this.data.content.length == 0) {
            return;
        }

        const ul: HTMLElement = document.createElement("ul");
        ul.classList.add("field-container");
        this.container.appendChild(ul);

        this.data.content.forEach((row: ModalRow) => this.createRow(ul, row));
        this.focusFirstField();
    }

    private createRow(ul: HTMLElement, row: ModalRow): void {
        const li: HTMLElement = document.createElement("li");
        li.classList.add("field-row-container");
        ul.appendChild(li);

        const label: HTMLElement = document.createElement("label");
        label.classList.add("extern-text");
        label.textContent = `${row.label} :`;
        li.appendChild(label);

        const input: HTMLInputElement = document.createElement("input");
        input.type = row.type.toLowerCase();

        if (row.defaultValue != undefined) {
            input.value = row.defaultValue;
        }

        if (row.maxLength != undefined) {
            input.maxLength = row.maxLength;
        }

        li.appendChild(input);

        if (row.type == "FILE") {
            if (row.data != undefined) {
                input.accept = row.data.join(",");
            }
            CenterModal.createFileInput(input);

        } else if (row.type == "SELECT" && row.data != undefined) {
            CenterModal.createSelectInput(input, row.data);
        }

        input.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key == "Escape") {
                setTimeout(() => input.blur(), 0);
            }
        });

        if (row.onChange != undefined) {
            input.addEventListener("input", () => row.onChange!(this));
        }
    }

    protected createFooter(): void {
        if (this.container == null) {
            return this.app.throwError("Can't create modal footer: Container element is null.");
        }

        const buttonContainer: HTMLElement = document.createElement("div");
        buttonContainer.classList.add("button-container");
        this.container.appendChild(buttonContainer);

        const confirmButton: HTMLElement = document.createElement("button");
        confirmButton.textContent = "Confirm";
        confirmButton.classList.add("confirm-button");
        buttonContainer.appendChild(confirmButton);
        
        confirmButton.addEventListener("click", async () => await AntiSpam.prevent(this.confirm()));

        if (this.data.additionnalButtons != null) {
            this.data.additionnalButtons.forEach((button: ModalButton) => {
                const buttonElement: HTMLElement = document.createElement("button");
                buttonElement.textContent = button.title;
                buttonContainer.appendChild(buttonElement);

                buttonElement.addEventListener("click", () => button.onClick());
            });
        }

        if (!this.data.cantClose) {
            const cancelButton: HTMLElement = document.createElement("button");
            cancelButton.textContent = "Cancel";
            cancelButton.classList.add("cancel-button");
            buttonContainer.appendChild(cancelButton);

            cancelButton.addEventListener("click", () => this.close());
        }
    }

    // EVENTS
    public close(): void {
        if (this.mainContainer == null) {
            return this.app.throwError("Can't close modal: Container element is null.");
        }

        const container: HTMLElement = this.mainContainer;
        container.classList.add("closing");
        this.closing = true;

        if (this.data.onCancel != null) {
            this.data.onCancel();
        }

        const closingDuration: number = ((this.app.settings.get().apparence.enableAnimations) ? this.closingDuration : 0);

        window.removeEventListener("keydown", this.keydownEvent);
        setTimeout(() => container.remove(), closingDuration);
    }

    public async confirm(): Promise<void> {
        if (this.closing) {
            return;
        }

        if (this.mainContainer == null) {
            return this.app.throwError("Can't confirm modal: Container element is null.");
        }

        this.removeErrors();

        const modalError: ModalError = await this.data.onConfirm(this);
        if (modalError != null) {

            const errorField: string | undefined = modalError.fieldName;
            (errorField != undefined) ? this.focusField(errorField) : this.focusFirstField();

            this.displayError(modalError.fieldName, modalError.error);
            return;
        }

        this.close();
    }

    // INPUT EVENTS
    protected focusFirstField(): void {
        if (this.mainContainer == null) {  
            return this.app.throwError("Can't focus first modal input: Container is null.");
        }

        const input: HTMLInputElement | null = this.mainContainer.querySelector("input");
        if (input != null) {
            input.focus();
            input.select();
        }
    }

    private focusField(fieldName: string): void {
        if (this.mainContainer == null) {  
            return this.app.throwError("Can't focus field: Container is null.");
        }

        const input: HTMLInputElement | null = this.getFieldInput(fieldName);
        if (input == null) {
            return;
        }

        input.focus();
        input.select();
    }

    private displayError(fieldName: string | undefined, message: string): void {
        if (fieldName == undefined) {
            this.app.modalManager.openTopModal("ERROR", message);
            return;
        }

        const rowContainer: HTMLElement | null = this.getFieldRowContainer(fieldName);
        if (rowContainer == null) {
            return this.app.throwError("Can't display modal error: Row container element is null.");
        }

        const errorElement: HTMLElement = document.createElement("error");
        errorElement.textContent = message;
        rowContainer.appendChild(errorElement);
    }

    private removeErrors(): void {
        const errorBase: string = "Can't remove modal errors";

        if (this.mainContainer == null) {
            return this.app.throwError(`${errorBase}: Container element is null.`);
        }

        [...this.mainContainer.querySelectorAll("error")].forEach((error: Element) => error.remove());
    }

    private static createFileInput(input: HTMLInputElement): void {
        const inputParentElement: HTMLElement | null = input.parentElement;
        if (inputParentElement == null) {
            return;
        }

        const containerElement: HTMLElement = document.createElement("input-file-container");
        inputParentElement.appendChild(containerElement);
        containerElement.appendChild(input);

        const dropAreaElement: HTMLElement = document.createElement("input-file-drop-area");
        dropAreaElement.classList.add("extern-text");
        containerElement.appendChild(dropAreaElement);

        const resetDropAreaText = (): void => {
            dropAreaElement.classList.remove("has-file");
            dropAreaElement.textContent = "Drag a file";
        }

        resetDropAreaText();

        input.addEventListener("change", (e: Event) => {
            if (input.files == null) {
                return resetDropAreaText();
            }

            if (input.files.length == 0) {
                return resetDropAreaText();
            }

            dropAreaElement.classList.add("has-file");
            dropAreaElement.textContent = input.files[0].name;
        });

        input.addEventListener("dragenter", () => dropAreaElement.classList.add("dragover"));
        input.addEventListener("dragleave", () => dropAreaElement.classList.remove("dragover"));
    }

    private static createSelectInput(input: HTMLInputElement, data: ModalRowData): InputSelect {
        return new InputSelect(input, data);
    }

    // GETTERS
    private getFieldRowContainer(fieldName: string): HTMLElement | null {
        fieldName += " :";

        if (this.mainContainer == null) {
            return null;
        }

        const labelElement: Element | undefined = [...this.mainContainer.querySelectorAll("label")].find((element: Element) => element.textContent == fieldName);
        if (labelElement == undefined) {
            return null;
        }

        return labelElement.parentElement;
    }

    public getFieldInput(fieldName: string): HTMLInputElement | null {
        const rowContainer: HTMLElement | null = this.getFieldRowContainer(fieldName);
        if (rowContainer == null) {
            return null;
        }

        return rowContainer.querySelector("input");
    }

    public getFileFromFileInput(fieldName: string): File | null {
        const inputElement: HTMLInputElement | null = this.getFieldInput(fieldName);
        if (inputElement == null) {
            return null;
        }

        if (inputElement.files == null) {
            return null;
        }

        return inputElement.files[0];
    }

    public getFieldValue(fieldName: string): string {
        const input: HTMLInputElement | null = this.getFieldInput(fieldName);
        if (input == null) {
            this.app.throwError("Can't get field value: Input element is null.");
            return "";
        }

        return input.value;
    }

    public getFieldValueIndex(fieldName: string): number | undefined {
        const errorBase: string = "Can't get field value index";

        const input: HTMLInputElement | null = this.getFieldInput(fieldName);
        if (input == null) {
            this.app.throwError(`${errorBase}: Input element is null.`);
            return undefined;
        }

        if (!input.hasAttribute("index")) {
            return undefined;
        }

        const index: number = Number(input.getAttribute("index"));
        if (isNaN(index)) {
            return undefined;
        }

        return index;
    }

    // SETTERS
    public setFieldValue(fieldName: string, value: string): void {
        const input: HTMLInputElement | null = this.getFieldInput(fieldName);
        if (input == null) {
            return this.app.throwError("Can't set field value: Input element is null.");
        }

        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
    }
};
