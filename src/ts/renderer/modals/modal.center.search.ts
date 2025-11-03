import App from "./../app.js";
import CenterModal from "./modal.center.js";

export default class CenterSearchModal extends CenterModal {
    constructor(app: App, data: CenterSearchModalData) {
        const centerModalData: CenterModalData = {
            title: data.title,
            onConfirm: data.onConfirm,
            onCancel: data.onCancel,
            cantClose: data.cantClose,
        };

        super(app, centerModalData);
    }

    protected override createContent(): void {
        this.createSearchBar();
    }

    private createSearchBar(): void {
        if (this.container == null) {
            return this.app.throwError("Can't create modal search bar: Container element is null.");
        }

        const searchBarElement: HTMLInputElement = document.createElement("input");
        this.container.appendChild(searchBarElement);
    }
}
