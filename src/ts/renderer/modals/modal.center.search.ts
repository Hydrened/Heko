import App from "./../app.js";
import CenterModal from "./modal.center.js";

export default class CenterSearchModal extends CenterModal {
    private searchTimeout: NodeJS.Timeout | null = null;

    private searchBarElement!: HTMLInputElement;
    private searchResultContainerElement!: HTMLElement;
        
    private onSearch: (resultContainerElement: HTMLElement, query: string) => Promise<void>;
    private searchDelay: number = 0;
    private instantSearchEnabled: boolean = false;

    constructor(app: App, data: CenterSearchModalData) {
        const centerModalData: CenterModalData = {
            title: data.title,
            onConfirm: async (modal: CenterModal) => await data.onConfirm(modal, this.searchResultContainerElement),
            onCancel: data.onCancel,
            cantClose: data.cantClose,
        };

        super(app, centerModalData);
        this.mainContainer!.classList.add("search");
        this.onSearch = data.onSearch;
        this.searchDelay = data.searchDelay;
        setTimeout(() => this.instantSearchEnabled = data.instantSearch, 0);
    }

    protected override createContent(): void {
        this.createSearchBar();
        super.focusFirstField();

        setTimeout(() => {
            if (this.instantSearchEnabled) {
                this.instantSearch();
            }
        }, 1);
    }

    private instantSearch(): void {
        if (this.searchResultContainerElement == null || this.searchBarElement == null) {
            return this.app.throwError("Can't instant search: Search bar or container elements is null.");
        }

        this.onSearch(this.searchResultContainerElement, this.searchBarElement.value);
    }

    private createSearchBar(): void {
        if (this.container == null) {
            return this.app.throwError("Can't create modal search bar: Container element is null.");
        }

        this.searchBarElement = document.createElement("input");
        this.container.appendChild(this.searchBarElement);

        this.searchResultContainerElement = document.createElement("ul");
        this.searchResultContainerElement.classList.add("search-result-container");
        this.container.appendChild(this.searchResultContainerElement);

        this.searchBarElement.addEventListener("input", () => this.searchBarElementOnInput());
    }

    private searchBarElementOnInput(): void {
        if (this.searchTimeout != null) {
            clearTimeout(this.searchTimeout);
        }

        this.searchTimeout = setTimeout(async () => {
            if (this.searchResultContainerElement == null || this.searchBarElement == null) {
                return this.app.throwError("Can't search: Search bar or container elements is null.");
            }

            this.searchTimeout = null;
            await this.onSearch(this.searchResultContainerElement, this.searchBarElement.value);
        }, this.searchDelay);
    }
}
