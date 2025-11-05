import App from "./../app.js";
import CenterModal from "./modal.center.js";

export default class CenterSearchModal extends CenterModal {
    private searchTimeout: NodeJS.Timeout | null = null;
    private onSearch: (resultContainerElement: HTMLElement, query: string) => Promise<void>;

    constructor(app: App, data: CenterSearchModalData) {
        const centerModalData: CenterModalData = {
            title: data.title,
            onConfirm: data.onConfirm,
            onCancel: data.onCancel,
            cantClose: data.cantClose,
        };

        super(app, centerModalData);
        this.onSearch = data.onSearch;
    }

    protected override createContent(): void {
        this.createSearchBar();
        super.focusFirstField();
    }

    protected override createFooter(): void {

    }

    private createSearchBar(): void {
        if (this.container == null) {
            return this.app.throwError("Can't create modal search bar: Container element is null.");
        }

        const searchBarElement: HTMLInputElement = document.createElement("input");
        this.container.appendChild(searchBarElement);

        const searchResultContainerElement: HTMLElement = document.createElement("ul");
        searchResultContainerElement.classList.add("search-result-container");
        this.container.appendChild(searchResultContainerElement);

        searchBarElement.addEventListener("input", () => this.searchBarElementOnInput(searchBarElement.value, searchResultContainerElement));
    }

    private searchBarElementOnInput(value: string, searchResultContainerElement: HTMLElement): void {
        if (this.searchTimeout != null) {
            clearTimeout(this.searchTimeout);
        }

        this.searchTimeout = setTimeout(async () => {
            this.searchTimeout = null;
            await this.onSearch(searchResultContainerElement, value);
        }, 700);
    }
}
