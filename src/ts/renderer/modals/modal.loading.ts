import * as Functions from "./../utils/utils.functions.js";

export default class LoadingModal {
    private container: HTMLElement | null = null;

    // INIT
    private constructor(private title: string) {
        this.open();
    }

    public static async create<T>(title: string, promise: Promise<T>): Promise<T> {
        const modal = new LoadingModal(title);
        const res: T = await promise;
        modal.close();
        return res;
    }

    // EVENTS
    private open(): void {
        this.container = document.createElement("loading-modal-container");
        document.body.appendChild(this.container);

        const titleElement: HTMLElement = document.createElement("h1");
        titleElement.textContent = this.title;
        this.container.appendChild(titleElement);

        const spinnerElement: HTMLElement = document.createElement("div");
        spinnerElement.classList.add("loading-spinner");
        this.container.appendChild(spinnerElement);
    }

    private close(): void {
        if (this.container == null) {
            return;
        }

        const container: HTMLElement = this.container;
        container.classList.add("closing");

        setTimeout(() => container.remove(), Number(Functions.getCssVariable("loading-modal-closing-duration", "MS_DURATION")));
    }
};
