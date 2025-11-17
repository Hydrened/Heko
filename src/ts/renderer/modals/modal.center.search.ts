import App from "./../app.js";
import CenterModal from "./modal.center.js";

export default class CenterSearchModal extends CenterModal {
    private searchTimeout: NodeJS.Timeout | null = null;

    private searchBarElement!: HTMLInputElement;
    private searchResultContainerElement!: HTMLElement;
        
    private onCreate: ((container: HTMLElement) => void) | undefined;
    private onSearch: ((container: HTMLElement, query: string) => Promise<void>) | null = null;
    private searchDelay: number = 0;

    constructor(app: App, data: CenterSearchModalData) {
        const centerModalData: CenterModalData = {
            title: data.title,
            onConfirm: async (modal: CenterModal) => await data.onConfirm(modal, this.searchResultContainerElement),
            onCancel: data.onClose,
            cantClose: data.cantClose,
        };

        super(app, centerModalData);
        this.mainContainer!.classList.add("search");

        this.onCreate = data.onCreate;
        setTimeout(() => this.onSearch = data.onSearch, 0);
        this.searchDelay = data.searchDelay;
    }

    protected override createContent(): void {
        this.createSearchBar();
        super.focusFirstField();
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
        
        setTimeout(() => {
            if (this.onCreate != undefined) {
                this.onCreate(this.searchResultContainerElement);
            }
        }, 1);
    }

    private searchBarElementOnInput(): void {
        if (this.searchTimeout != null) {
            clearTimeout(this.searchTimeout);
        }

        this.searchTimeout = setTimeout(async () => {
            if (this.onSearch == null) {
                return;
            }

            if (this.searchResultContainerElement == null || this.searchBarElement == null) {
                return this.app.throwError("Can't search: Search bar or container elements is null.");
            }

            this.searchTimeout = null;
            await this.onSearch(this.searchResultContainerElement, this.searchBarElement.value);
        }, this.searchDelay);
    }

    public static createCheckboxRow(title: string): HTMLElement {
        const container: HTMLElement = document.createElement("li");
        container.classList.add("checkbox-row");

        const titleElement: HTMLElement = document.createElement("h2");
        titleElement.classList.add("song-title-and-artist");
        titleElement.classList.add("text-overflow");
        titleElement.textContent = title;
        container.appendChild(titleElement);

        const checkboxElement: HTMLInputElement = document.createElement("input");
        checkboxElement.setAttribute("tabindex", String(-1));
        checkboxElement.type = "checkbox";
        container.appendChild(checkboxElement);

        container.addEventListener("click", (e: PointerEvent) => {
            if (e.target == null) {
                return;
            }
    
            if ([container, titleElement].includes((e.target as HTMLElement))) {
                checkboxElement.checked = !checkboxElement.checked;
            }
        });

        return container;
    }

    public getCheckedElements(): HTMLElement[] {
        const liElements: HTMLElement[] = [...this.searchResultContainerElement.querySelectorAll<HTMLElement>("li")];

        return liElements.filter((li: HTMLElement) => {
            const checkbox: HTMLInputElement | null = li.querySelector<HTMLInputElement>("input");
            return (checkbox?.checked);
        });
    }
}
