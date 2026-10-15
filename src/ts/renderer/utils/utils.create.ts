import Api from "./utils.api.js";
import Elements from "./utils.elements.js";
import Functions from "./utils.functions.js";
import "./utils.types.js";

// BAR
export class Bar {
    private readonly fillElement: HTMLElement = document.createElement("div");

    // INIT
    public constructor(private readonly containerElement: HTMLElement) {
        this.containerElement.classList.add("bar");
        this.fillElement.classList.add("fill");
        this.containerElement.appendChild(this.fillElement);
    }

    // PUBLIC
    public setFill(percentage: number): void {
        percentage = Functions.Maths.clamp(percentage, 0, 100);
        this.fillElement.style.width = `${percentage}%`;
    }
}

export function bar(containerElement: HTMLElement, percentage: number): Bar {
    const bar: Bar = new Bar(containerElement);
    bar.setFill(percentage);
    return bar;
}



// NOTIFICATION
export async function notification(message: string, type: "success" | "error" | "none" = "none"): Promise<void> {
    const openedClassName: string = "opened";

    const containerElement: HTMLElement = document.createElement("div");
    containerElement.classList.add("notification-container", type);
    containerElement.textContent = message;
    Elements.main.appendChild(containerElement);

    setTimeout(() => containerElement.classList.add(openedClassName), 10);

    const transitionDuration: number = Functions.Css.get("notification-transition-duration", "ms-duration");

    return new Promise<void>((resolve: Resolve<void>) => {
        const close = (): void => {
            containerElement.classList.remove(openedClassName);

            setTimeout(() => {
                containerElement.remove();
                resolve();
            }, transitionDuration);
        };

        containerElement.addEventListener("click", close, { once: true });

        setTimeout(() => {
            containerElement.classList.remove(openedClassName);
            setTimeout(close, transitionDuration);
        }, 5000);
    });
}



// INPUT-LIST
export class HTMLInputListElement extends HTMLElement {
    private static readonly version: string = "1.4";
    private static readonly focusedClassName: string = "focused";
    private static readonly hiddenClassName: string = "hidden";

    private readonly _inputElement: HTMLInputElement = document.createElement("input");
    private readonly _listElementContainer: HTMLUListElement = document.createElement("ul");
    private _listElements: (HTMLLIElement | null)[] = [];

    private _focusedIndex: number = -1;
    private _valueId: number = -1;

    private _data: InputListValue[] = [];
    private _value: string = "";
    private _rawValue: string = "";
    private _limit: number = 10000;
    private _smartSearch: boolean = false;
    private _caseSensitive: boolean = false;

    // INIT
    public constructor() {
        super();
    }

    private connectedCallback(): void {
        this._inputElement.name = "input-list";
        this._inputElement.type = "text";
        this._inputElement.autocomplete = "off";
        this._inputElement.autocapitalize = "off";
        this._inputElement.spellcheck = false;
        this._inputElement.autocorrect = false;

        this.appendChild(this._inputElement);
        this.appendChild(this._listElementContainer);

        this.initEvents();
    }

    private disconnectedCallback(): void {
        window.removeEventListener("click", this.onWindowClick);
        window.removeEventListener("keydown", this.onWindowKeydown);

        this.removeEventListener("click", this.filter);

        this._inputElement.removeEventListener("input", this.onInputElementInput);
        this._inputElement.removeEventListener("focus", this.focus);
        this._inputElement.removeEventListener("blur", this.blur);
    }

    private initEvents(): void {
        window.addEventListener("click", this.onWindowClick);
        window.addEventListener("keydown", this.onWindowKeydown);

        this.addEventListener("click", this.filter);

        this._inputElement.addEventListener("input", this.onInputElementInput);
        this._inputElement.addEventListener("focus", this.focus);
        this._inputElement.addEventListener("blur", this.blur);
    }

    // HTML EVENTS
    private onChange(): void {
        this.dispatchEvent(new CustomEvent("change", { bubbles: true }));
    }

    private onOptionClick(): void {
        this.dispatchEvent(new CustomEvent("option-click", { bubbles: true }));
    }
    
    // PRIVATE EVENTS
    private onWindowClick = (e: PointerEvent): void => {
        if (e.target === null) {
            return;
        }

        if (!this.contains(e.target as Node)) {
            this.blur();
        }
    }

    private onWindowKeydown = (e: KeyboardEvent): void => {
        const key: string = e.key;

        switch (key) {
            case "Escape": this.blur(); break;
            case "ArrowUp": this.incrSelected(-1); break;
            case "ArrowDown": this.incrSelected(1); break;
            case "Enter": this.confirmChoice(); break;
            default: return;
        }
    }

    private onInputElementInput = (): void => {
        this._rawValue = this._inputElement.value;
        this._valueId = -1;
        this.filter();
    }

    private onListElementClick(e: MouseEvent, value: InputListValue): void {
        e.preventDefault();

        this.value = value;
        this.filter();
        this.blur();
        this.onOptionClick();
    }

    // OTHER
    private refreshData(): void {
        this.removeListElementChildren();

        this._listElements = Array(this._data.length).fill(null);

        this._data.forEach((value: InputListValue, index: number) => {
            const liElement: HTMLLIElement = document.createElement("li");
            liElement.textContent = value.name;
            liElement.classList.add("input-list-li", HTMLInputListElement.hiddenClassName, "one-line-text");
            this._listElementContainer.appendChild(liElement);
            liElement.addEventListener("mousedown", (e: MouseEvent) => this.onListElementClick(e, value));

            this._listElements[index] = liElement;
        });
    }

    private refreshScrollPosY(focusedLiElement: HTMLLIElement | null): void {
        if (focusedLiElement === null) {
            return;
        }

        const liHeight: number = focusedLiElement.getBoundingClientRect().height;
        const liTop: number = focusedLiElement.offsetTop;
        const liBottom: number = liTop + liHeight;

        const listContainerHeight: number = this._listElementContainer.getBoundingClientRect().height - 2;
        const minContainerScrollY: number = this._listElementContainer.scrollTop;
        const maxContainerScrollY: number = minContainerScrollY + listContainerHeight;
            
        if (liTop < minContainerScrollY) {
            this._listElementContainer.scrollTop = liTop;
        }
        else if (liBottom > maxContainerScrollY) {
            this._listElementContainer.scrollTop = liBottom - listContainerHeight;
        }
    }

    private removeListElementChildren(): void {
        const children: Element[] = [...this._listElementContainer.children].reverse();
        children.forEach((c: Element) => c.remove());
    }

    private filter = (): void => {
        const query: string = (this._caseSensitive ? this._inputElement.value : this._inputElement.value.toLowerCase());
        const startingValue: string = this._value;

        this._focusedIndex = -1;
        this._value = "";

        this._data.forEach((entry: InputListValue, index: number) => {
            const liElement: HTMLLIElement | null = this._listElements[index] ?? null;
            if (liElement === null) {
                return;
            }

            liElement.classList.remove(HTMLInputListElement.focusedClassName);

            const name: string = (this._caseSensitive ? entry.name : entry.name.toLowerCase());

            const includes: boolean = (this._smartSearch) ? HTMLInputListElement.smartIncludes(name, query, this._caseSensitive) : name.includes(query);
            (includes) ? liElement.classList.remove(HTMLInputListElement.hiddenClassName) : liElement.classList.add(HTMLInputListElement.hiddenClassName);

            if (name === query) {
                this._value = entry.name;
                this._valueId = entry.id;
            }
        });

        if (startingValue !== this._value) {
            this.onChange();
        }
    }

    private incrSelected(incr: number): void {
        const visibleLis: (HTMLLIElement | null)[] = this._listElements.filter((liElement: HTMLLIElement | null) => {
            if (liElement === null) {
                return false;
            }

            return !liElement.classList.contains(HTMLInputListElement.hiddenClassName);
        });

        const nbVisibleLi: number = visibleLis.length;

        if (this._focusedIndex === -1) {
            this._focusedIndex = (incr > 0) ? 0 : nbVisibleLi - 1;
        }
        else {
            this._focusedIndex += incr;
        }

        let counter: number = 0;
        while (this._focusedIndex < 0 && counter < this._limit) {
            this._focusedIndex += nbVisibleLi;
            counter++;
        }

        counter = 0;
        while (this._focusedIndex > nbVisibleLi - 1 && counter < this._limit) {
            this._focusedIndex -= nbVisibleLi;
            counter++;
        }

        const focusedLiElement: HTMLLIElement | null = visibleLis[this._focusedIndex] ?? null;
        this.refreshScrollPosY(focusedLiElement);

        if (focusedLiElement === null) {
            return;
        }

        this._listElements.forEach((liElement: HTMLLIElement | null) => liElement?.classList.remove(HTMLInputListElement.focusedClassName));
        focusedLiElement.classList.add(HTMLInputListElement.focusedClassName);
    }

    private confirmChoice(): void {
        const focusedLiElementIndex: number = this._listElements.findIndex((liElement: HTMLLIElement | null) => liElement?.classList.contains(HTMLInputListElement.focusedClassName) ?? false);
        if (focusedLiElementIndex === -1) {
            return;
        }

        const value: InputListValue | null = this._data[focusedLiElementIndex] ?? null;

        this._value = value?.name ?? "";
        this._valueId = value?.id ?? -1;

        if (value === null) {
            return;
        }

        this.value = value;
        this.blur();
    }

    private static smartIncludes(base: string, query: string, caseSensitive: boolean = false): boolean {
        const queries: string[] = (caseSensitive ? query : query.toLowerCase()).split(" ");
        const filter: string[] = (caseSensitive ? base : base.toLowerCase()).split(" ");

        return queries.every((value: string) => filter.some((filterWord: string) => filterWord.includes(value)));
    }

    // PUBLIC
    public focus = (): void => {
        this._inputElement.focus();
        this.filter();
    }

    public blur = (): void => {
        this._listElements.forEach((liElement: HTMLLIElement | null) => {
            liElement?.classList.add(HTMLInputListElement.hiddenClassName);
            liElement?.classList.remove(HTMLInputListElement.focusedClassName);
        });

        this._focusedIndex = -1;

        setTimeout(() => this._inputElement.blur(), 0);
    }

    public set data(d: InputListValue[]) {
        this._data = d.sort((a: InputListValue, b: InputListValue) => a.name.localeCompare(b.name));

        this._focusedIndex = -1;

        this._inputElement.value = "";

        this._value = "";
        this._rawValue = "";
        this._valueId = -1;

        this.refreshData();
    }

    public set value(v: InputListValue | null) {
        if (v === null) {
            this._inputElement.value = "";

            this._value = "";
            this._rawValue = "";
            this._valueId = -1;

            this.onChange();
            return;
        }

        const isValueValid: boolean = this._data.some((d: InputListValue) => d.id === v.id && d.name === v.name);
        if (!isValueValid) {
            return;
        }

        this._inputElement.value = v.name;
        
        this._value = v.name;
        this._rawValue = v.name;
        this._valueId = v.id;

        this.onChange();
    }

    public set limit(value: number) {
        this._limit = value;
    }

    public set smartSearch(state: boolean) {
        this._smartSearch = state;
    }

    public set caseSensitive(state: boolean) {
        this._caseSensitive = state;
    }

    public get inputElement(): HTMLInputElement {
        return this._inputElement;
    }

    public get data(): InputListValue[] {
        return this._data;
    }

    public get value(): InputListValue | null {
        return (this._valueId !== -1) ? { id: this._valueId, name: this._value } : null;
    }

    public get rawValue(): string {
        return this._rawValue;
    }

    public get limit(): number {
        return this._limit;
    }

    public get smartSearch(): boolean {
        return this._smartSearch;
    }

    public get caseSensitive(): boolean {
        return this._caseSensitive;
    }

    public get isFocused(): boolean {
        return this._inputElement === document.activeElement;
    }
};

customElements.define("input-list", HTMLInputListElement);



// SMART-LIST
export class HTMLSmartListElement extends HTMLElement {
    private static readonly version: string = "1.5";
    private static readonly antiSpamClassName: string = "anti-spam";

    private readonly _inputContainerElement: HTMLElement = document.createElement("div");
    private readonly _inputListElement: HTMLInputListElement = document.createElement("input-list") as HTMLInputListElement;
    private readonly _addButtonElement: HTMLButtonElement = document.createElement("button");
    private readonly _listElement: HTMLElement = document.createElement("ul");

    private _data: InputListValue[] = [];
    private _values: InputListValue[] = [];
    private _onInvalidAdd?: (query: string) => Promise<InputListValue | null> = undefined;

    // INIT
    public constructor() {
        super();
    }

    private connectedCallback(): void {
        this._inputContainerElement.classList.add("input-container");
        this.appendChild(this._inputContainerElement);
        
        this._inputContainerElement.appendChild(this._inputListElement);

        this._addButtonElement.textContent = "✚";
        this._inputContainerElement.appendChild(this._addButtonElement);
        HTMLSmartListElement.disableElement(this._addButtonElement);

        this._listElement.classList.add("values-container");
        this.appendChild(this._listElement);

        this.initEvents();
    }

    private disconnectedCallback(): void {
        this._inputListElement.removeEventListener("keydown", this.onInputListKeydown);
        this._inputListElement.removeEventListener("input", this.onInputListInput);
        this._addButtonElement.removeEventListener("click", this.onAddButtonClick);
        this._inputListElement.removeEventListener("option-click", this.onInputListOptionClick);
    }

    private initEvents(): void {
        this._inputListElement.addEventListener("keydown", this.onInputListKeydown);
        this._inputListElement.addEventListener("input", this.onInputListInput);
        this._addButtonElement.addEventListener("click", this.onAddButtonClick);
        this._inputListElement.addEventListener("option-click", this.onInputListOptionClick);
    }

    // HTML EVENTS
    private onListChange(): void {
        this.dispatchEvent(new CustomEvent("list-change", { bubbles: true }));
    }

    // PRIVATE EVENTS
    private onInputListKeydown = (e: KeyboardEvent): void => {
        if (e.key !== "Enter") {
            return;
        }

        setTimeout(() => this.onAddValue(), 0);
    }

    private onInputListInput = (): void => {
        HTMLSmartListElement.disableElement(this._addButtonElement);

        const query: string = this._inputListElement.rawValue;
        if (query === "") {
            return;
        }

        if (this._data.length === 0) {
            HTMLSmartListElement.enableElement(this._addButtonElement);
            return;
        }

        const isValid: boolean = (this._inputListElement.value !== null);
        if ((this._onInvalidAdd !== undefined && !isValid) || isValid) {
            HTMLSmartListElement.enableElement(this._addButtonElement);
        }
    }

    private onAddButtonClick = (): void => {
        HTMLSmartListElement.antiSpam<void>(this._addButtonElement, async () => {
            await this.onAddValue();
        });
    }

    private onInputListOptionClick = (): void => {
        HTMLSmartListElement.antiSpam<void>(this._inputListElement, async () => {
            await this.onAddValue();
        });
    }

    private async onAddValue(): Promise<void> {
        let value: InputListValue | null = this._inputListElement.value;
        const query: string = this._inputListElement.rawValue;

        const isFiltering: boolean = (this._data.length !== 0);

        if (this._onInvalidAdd !== undefined && value === null) {
            value = await this._onInvalidAdd(query);

            if (value !== null) {
                const newData: InputListValue[] = [...this._data, value];
                this._data = newData;
                this._inputListElement.data = newData;
            }
        }

        if (value === null && isFiltering) {
            return;
        }

        this._inputListElement.value = null;
        HTMLSmartListElement.disableElement(this._addButtonElement);

        if (value !== null && isFiltering) {
            this._values.push(value);
            this.onListChange();
        }
        else if (!isFiltering) {
            this._values.push({ id: -1, name: query });
            const uniqueValues: string[] = [... new Set(this._values.map<string>((v: InputListValue) => v.name))];
            this._values = uniqueValues.map<InputListValue>((uv: string) => { return { id: -1, name: uv }});
            this.onListChange();
        }

        this.refreshList();
    }

    private onRemoveValue(index: number): void {
        this._values = this._values.filter((v: InputListValue, i: number) => i !== index);
        this.onListChange();
        this.refreshList();
    }

    // OTHER
    private static enableElement(element: HTMLElement): void {
        element.classList.remove("disabled");
        element.removeAttribute("disabled");
    }

    private static disableElement(element: HTMLElement): void {
        element.classList.add("disabled");
        element.setAttribute("disabled", "");
    }

    private static async antiSpam<T>(element: HTMLElement, action: () => Promise<T>): Promise<T | null> {
        if (element.classList.contains(HTMLSmartListElement.antiSpamClassName)) {
            return null;
        }

        element.classList.add(HTMLSmartListElement.antiSpamClassName);
        const res: T = await action();
        element.classList.remove(HTMLSmartListElement.antiSpamClassName);

        return res;
    }

    private removeListElementChildren(): void {
        const children: Element[] = [...this._listElement.children].reverse();
        children.forEach((c: Element) => c.remove());
    }

    private refreshList(): void {
        this.removeListElementChildren();

        const valueIds: ID[] = this._values.map<ID>((v: InputListValue) => v.id);
        this._inputListElement.data = this._data.filter((d: InputListValue) => !valueIds.includes(d.id));

        this._values.forEach((v: InputListValue, index: number) => {
            const liElement: HTMLLIElement = document.createElement("li");
            liElement.classList.add("value-container");
            this._listElement.prepend(liElement);

            const nameELement: HTMLParagraphElement = document.createElement("p");
            nameELement.classList.add("value-name");
            nameELement.textContent = v.name;
            liElement.appendChild(nameELement);

            const removeButtonElement: HTMLButtonElement = document.createElement("button");
            removeButtonElement.classList.add("value-remove-button");
            removeButtonElement.textContent = "✖";
            liElement.appendChild(removeButtonElement);

            removeButtonElement.addEventListener("click", () => this.onRemoveValue(index));
        });
    }

    // SETTERS
    public set data(data: InputListValue[]) {
        this.valuesFromData = [];
        this._data = data;
        this._inputListElement.data = data;
        this.onInputListInput();
    }

    public set valuesFromData(values: InputListValue[]) {
        const isFiltering: boolean = (this._data.length !== 0);
        if (!isFiltering) {
            return;
        }

        this._values = values.filter((v: InputListValue) => {
            return this._data.some((d: InputListValue) => d.id === v.id);
        }).filter((v: InputListValue, index: number, array: InputListValue[]) => {
            return array.findIndex((d) => d.id === v.id) === index;
        });
        
        this.onInputListInput();
        this.onListChange();
        this.refreshList();
    }

    public set values(values: string[]) {
        const isFiltering: boolean = (this._data.length !== 0);
        if (isFiltering) {
            return;
        }

        values = [... new Set(values)];
        this._values = values.map<InputListValue>((v: string) => { return { id: -1, name: v }});

        this.onInputListInput();
        this.onListChange();
        this.refreshList();
    }

    public set value(value: string) {
        this._inputListElement.inputElement.value = value;
        this.onInputListInput();
    }

    public set limit(value: number) {
        this._inputListElement.limit = value;
    }

    public set smartSearch(state: boolean) {
        this._inputListElement.smartSearch = state;
    }

    public set caseSensitive(state: boolean) {
        this._inputListElement.caseSensitive = state;
    }

    public set onInvalidAdd(callback: ((query: string) => Promise<InputListValue | null>) | undefined) {
        this._onInvalidAdd = callback;
    }

    // GETTERS
    public get inputListElement(): HTMLInputListElement {
        return this._inputListElement;
    }

    public get data(): InputListValue[] {
        return this._data;
    }

    public get valuesFromData(): InputListValue[] {
        return this._values;
    }

    public get values(): string[] {
        return this._values.map<string>((v: InputListValue) => v.name);
    }

    public get value(): string {
        return this._inputListElement.inputElement.value;
    }

    public get limit(): number {
        return this._inputListElement.limit;
    }

    public get smartSearch(): boolean {
        return this._inputListElement.smartSearch;
    }

    public get caseSensitive(): boolean {
        return this._inputListElement.caseSensitive;
    }

    public get onInvalidAdd(): ((query: string) => Promise<InputListValue | null>) | undefined {
        return this._onInvalidAdd;
    }

    public get isFocused(): boolean {
        return this._inputListElement.isFocused;
    }
};

customElements.define("smart-list", HTMLSmartListElement);



// SMALL-MODAL
class SmallModal<T> {
    private static readonly version: string = "1.4";
    private static readonly transitionDuration: number = Functions.Css.get("modal-transition-duration", "ms-duration");

    private readonly options: SmallModalOption<T>[];

    private readonly containerElement: HTMLElement = document.createElement("div");
    private readonly optionsContainerElement: HTMLUListElement = document.createElement("ul");

    private readonly hasShortcuts: boolean;
    private readonly isInformative: boolean;

    private value: Value<T> | null = null;

    // INIT
    public constructor(options: SmallModalOption<T>[], private readonly message: string | null, private readonly onClose: () => void) {
        this.options = [...options];

        this.initContainer();

        this.isInformative = (this.message != null);
        this.hasShortcuts = this.options.some((option: SmallModalOption<T>) => option.shortcut !== undefined);

        if (this.isInformative) {
            this.options.unshift({ name: this.message!, id: null as T, shortcut: undefined, onClick: undefined });
        }

        this.createOptions();
        this.initEvents();
    }

    private initContainer(): void {
        this.containerElement.classList.add("small-modal-container");
        document.body.appendChild(this.containerElement);

        setTimeout(() => this.containerElement.classList.add("opened"), 10);

        const wrapperElement: HTMLElement = document.createElement("div");
        wrapperElement.classList.add("small-modal-wrapper");
        this.containerElement.appendChild(wrapperElement);

        this.optionsContainerElement.classList.add("options-container");
        wrapperElement.appendChild(this.optionsContainerElement);
    }

    private createOptions(): void {
        this.options.forEach((option: SmallModalOption<T>, index: number) => {
            const optionContainerElement: HTMLLIElement = document.createElement("li");
            optionContainerElement.classList.add("option-container");
            optionContainerElement.textContent = option.name;
            this.optionsContainerElement.appendChild(optionContainerElement);

            if (index === 0 && this.isInformative) {
                optionContainerElement.classList.add("information");
                return;
            }

            optionContainerElement.addEventListener("click", () => Functions.Elements.antiSpam<void>(optionContainerElement, async () => {
                if (option.onClick !== undefined) {
                    await option.onClick();
                }

                await this.close(option);
            }));
        });
    }

    private initEvents(): void {
        if (this.hasShortcuts) {
            window.addEventListener("keydown", this.onKeydown);
        }

        this.containerElement.addEventListener("click", (e: PointerEvent) => this.onClick(e));
    }

    // EVENTS
    private onKeydown = (e: KeyboardEvent): void => {
        const key: string = e.key;

        const shortcutOption: SmallModalOption<T> | undefined = this.options.find((option: SmallModalOption<T>) => option.shortcut === key);
        if (shortcutOption === undefined && key !== "Escape") {
            return;
        }

        if (key === "Escape") {
            this.close(null);
        }

        if (shortcutOption === undefined) {
            return;
        }

        this.close(shortcutOption);
    };

    private onClick(e: PointerEvent): void {
        if (e.target === this.containerElement) {
            this.close(null);
        }
    }

    private async close(value: Value<T> | null): Promise<void> {
        this.value = value;

        this.containerElement.classList.remove("opened");

        if (this.hasShortcuts) {
            window.removeEventListener("keydown", this.onKeydown);
        }

        this.onClose();
        setTimeout(() => this.containerElement.remove(), SmallModal.transitionDuration);
    }

    // PUBLIC
    public getValue(): Value<T> | null {
        return this.value;
    }
};

async function smallModal<T>(options: SmallModalOption<T>[], message?: string): Promise<Value<T> | null> {
    return await new Promise<Value<T> | null>((resolve: Resolve<Value<T> | null>) => {
        const smallModal: SmallModal<T> = new SmallModal<T>(options, message ?? null, () => resolve(smallModal.getValue()));
    });
}

export async function choiceModal<T>(options: SmallModalOption<T>[], message?: string): Promise<Value<T> | null> {
    return await smallModal<T>(options, message);
}

export async function confirmModal(message?: string, options?: SmallModalOption<boolean>[]): Promise<boolean> {
    if (options === undefined) {
        options = [
            { name: "Yes", id: true, shortcut: "Enter" },
            { name: "No", id: false, shortcut: "Escape" },
        ];
    }

    const res: Value<boolean> | null = await choiceModal<boolean>(options, message);
    if (res === null) {
        return false;
    }

    return res.id;
}

export async function informationModal(message: string): Promise<void> {
    await smallModal([{ name: "OK", id: "", shortcut: "Enter" }], message);
}



// CONTEXTMENU
export class ContextmenuManager {
    private static readonly version: string = "1.2";

    private static readonly menuWidth: number = Functions.Css.get("contextmenu-width", "pixel");
    private static readonly rowHeight: number = Functions.Css.get("contextmenu-row-height", "pixel");
    private static readonly menuPadding: number = Functions.Css.get("contextmenu-padding", "pixel");
    private static readonly focusedElementClassName: string = "contextmenu-focused";

    private static currentElement: HTMLElement | null = null;
    private static currentFocusedElement: HTMLElement | null = null;

    // INIT
    public constructor() {
        this.initEvents();
    }

    private initEvents(): void {
        window.addEventListener("click", (e: PointerEvent) => this.onWindowClick(e));
        window.addEventListener("contextmenu", (e: PointerEvent) => this.onWindowClick(e));
    }

    // EVENTS
    private onWindowClick(e: PointerEvent): void {
        if (ContextmenuManager.currentElement === null) {
            return;
        }

        const targetElement: HTMLElement = e.target as HTMLElement;
        if (ContextmenuManager.currentElement.contains(targetElement)) {
            return;
        }

        ContextmenuManager.close();
    }

    // OTHER
    private static close(): void {
        ContextmenuManager.currentElement?.remove();
        ContextmenuManager.currentFocusedElement?.classList.remove(ContextmenuManager.focusedElementClassName);
    }

    private static shortcutToString(shortcut: ContextmenuShortCut): string {
        const splited: string[] = [];

        if (shortcut.ctrl) {
            splited.push("Ctrl");
        }
        if (shortcut.shift) {
            splited.push("Shift");
        }
        if (shortcut.alt) {
            splited.push("Alt");
        }

        splited.push(Functions.Strings.capitalize(shortcut.key));

        return splited.join("+");
    }

    // CREATE
    public static async create(rows: ContextmenuRow[], position: Position, focusedElement?: HTMLElement): Promise<void> {
        await Functions.Time.sleep(10);
        ContextmenuManager.close();

        ContextmenuManager.currentElement = document.createElement("div");
        ContextmenuManager.currentFocusedElement = focusedElement ?? null;
        ContextmenuManager.currentFocusedElement?.classList.add(ContextmenuManager.focusedElementClassName);

        const menuRect: Rect = ContextmenuManager.getMenuRect(position, rows.length);
        if (!ContextmenuManager.hasEnoughtSpaceX(position, rows.length)) {
            ContextmenuManager.currentElement.classList.add("inverted-x");
        }

        if (!ContextmenuManager.hasEnoughtSpaceY(position, rows.length)) {
            position.y -= menuRect.h;
        }

        ContextmenuManager.currentElement.classList.add("contextmenu-container");
        ContextmenuManager.currentElement.style.left = `${position.x}px`;
        ContextmenuManager.currentElement.style.top = `${position.y}px`;
        document.body.appendChild(ContextmenuManager.currentElement);

        const rowsContainerElement: HTMLUListElement = document.createElement("ul");
        rowsContainerElement.classList.add("rows-container");
        ContextmenuManager.currentElement.appendChild(rowsContainerElement);

        position.x += ContextmenuManager.menuPadding;
        position.y += ContextmenuManager.menuPadding;

        this.createRows(rowsContainerElement, rows, position);
    }

    private static createRows(rowsContainerElement: HTMLUListElement, rows: ContextmenuRow[], position: Position): void {
        const menuRect: Rect = ContextmenuManager.getMenuRect(position, rows.length);
        if (!ContextmenuManager.hasEnoughtSpaceY(position, rows.length)) {
            position.y -= menuRect.h;
            rowsContainerElement.classList.add("inverted-y");
        }

        const defaultY: number = position.y;

        rows.forEach((row: ContextmenuRow, index: number) => {
            position.y = defaultY + ContextmenuManager.rowHeight * index;
            ContextmenuManager.createRow(rowsContainerElement, row, position);
        });
    }

    private static createRow(rowsContainerElement: HTMLUListElement, row: ContextmenuRow, position: Position): void {
        const isDisabled: boolean = (row.disabled === true);
        const hasShortcut: boolean = (row.shortcut !== undefined);
        const hasOnClick: boolean = (row.onClick !== undefined);
        const hasRows: boolean = ((row.rows?.length ?? 0) > 0);

        const rowWrapperElement: HTMLLIElement = document.createElement("li");
        rowWrapperElement.classList.add("row-wrapper");

        if (isDisabled) {
            rowWrapperElement.classList.add("disabled");
        }

        const rowContainerElement: HTMLElement = document.createElement("div");
        rowContainerElement.classList.add("row-container");
        rowWrapperElement.appendChild(rowContainerElement);

        const titleElement: HTMLParagraphElement = document.createElement("p");
        titleElement.classList.add("title", "one-line-text");
        titleElement.textContent = row.title;
        rowContainerElement.appendChild(titleElement);

        if (hasShortcut && !isDisabled && !hasRows) {
            const shortcutElement: HTMLParagraphElement = document.createElement("p");
            shortcutElement.classList.add("shortcut", "one-line-text");
            shortcutElement.textContent = ContextmenuManager.shortcutToString(row.shortcut!);
            rowContainerElement.appendChild(shortcutElement);
        }

        if (hasRows && !isDisabled) {
            rowContainerElement.classList.add("has-sub-rows");

            const systrayElement: HTMLParagraphElement = document.createElement("p");
            systrayElement.classList.add("systray");
            systrayElement.textContent = "❯";
            rowContainerElement.appendChild(systrayElement);

            const subRowsContainerElement: HTMLUListElement = document.createElement("ul");
            subRowsContainerElement.classList.add("rows-container", "sub-rows-container");
            rowWrapperElement.appendChild(subRowsContainerElement);

            this.createRows(subRowsContainerElement, row.rows!, position);
        }

        if (hasOnClick && !hasRows && !isDisabled) {
            rowContainerElement.addEventListener("click", () => {
                (row.onClick !== undefined) ? row.onClick() : {};
                ContextmenuManager.close();
            });
        }

        rowsContainerElement.appendChild(rowWrapperElement);
    }

    private static getWindowRect(): Rect {
        return {
            x: 0,
            y: 0,
            w: window.innerWidth,
            h: window.innerHeight,
        };
    }

    private static getMenuRect(position: Position, rowsCount: number): Rect {
        return {
            x: position.x,
            y: position.y,
            w: ContextmenuManager.menuWidth,
            h: ContextmenuManager.rowHeight * rowsCount + ContextmenuManager.menuPadding * 2,
        };
    }

    private static hasEnoughtSpaceX(position: Position, rowsCount: number): boolean {
        const windowRect: Rect = ContextmenuManager.getWindowRect();
        const menuRect: Rect = ContextmenuManager.getMenuRect(position, rowsCount);

        return Functions.Maths.isPointInRect(windowRect, { x: menuRect.x + menuRect.w, y: 0 });
    }

    private static hasEnoughtSpaceY(position: Position, rowsCount: number): boolean {
        const windowRect: Rect = ContextmenuManager.getWindowRect();
        const menuRect: Rect = ContextmenuManager.getMenuRect(position, rowsCount);

        return Functions.Maths.isPointInRect(windowRect, { x: 0, y: menuRect.y + menuRect.h });
    }
};

new ContextmenuManager();



// MODAL
abstract class ModalField<V, D extends ModalFieldChildData<V>, E extends HTMLElement | void> {
    protected readonly fieldContainerElement: HTMLLIElement;

    public constructor(protected readonly modal: Modal, private readonly pData: D) {
        this.fieldContainerElement = document.createElement("li");
        this.fieldContainerElement.classList.add("field-container");

        if (this.pData.label !== undefined) {
            const labelElement: HTMLLabelElement = document.createElement("label");
            labelElement.textContent = this.pData.label;
            this.fieldContainerElement.appendChild(labelElement);
        }
    }

    public destruct(): void {}

    public errorMessage(value: V | null): string | null {
        return (this.pData.errorMessage !== undefined) ? this.pData.errorMessage(this.modal, value) : null;
    }

    public abstract setValue(value: V | null): void;

    public getData(): D {
        return this.pData;
    }

    public getId(): string {
        return this.pData.id;
    }

    public getMinLength(): number | null {
        return null;
    }

    public getValueLength(): number | null {
        return null;
    }

    public getFieldContainerElement(): HTMLLIElement {
        return this.fieldContainerElement;
    }

    public abstract getErrorElement(): HTMLElement;

    public abstract getMainElement(): E;

    protected static getDataValue(data: InputListValue[], value: ID | null): InputListValue | null {
        return data.find((d: InputListValue) => d.id === value) ?? null;
    }

    protected static getDataValues(data: InputListValue[], values: ID[] | null): InputListValue[] | null {
        const res: InputListValue[] = [];

        (values ?? []).forEach((value: ID) => {
            const fullValue: InputListValue | null = ModalField.getDataValue(data, value);
            if (fullValue === null) {
                return;
            }

            res.push(fullValue);
        });

        return res;
    }

    public abstract getValue(): V | null;

    public abstract isMandatory(): boolean;

    public abstract isFocused(): boolean;

    protected static isLengthValid(minLength: number, value: string | null): boolean {
        const length: number = (value ?? "").length;
        return length >= minLength;
    }

    public async isConditionValid(value: V | null): Promise<boolean> {
        return (this.pData.isConditionValid !== undefined) ? await this.pData.isConditionValid(this.modal, value) : true;
    }
};

class InputModalField extends ModalField<string, ModalInputFieldData, HTMLInputElement> {
    private readonly inputElement: HTMLInputElement;

    public constructor(modal: Modal, private readonly data: ModalInputFieldData) {
        super(modal, data);

        this.inputElement = Functions.Elements.createInput(data.type ?? "text", this.data.id);
        this.fieldContainerElement.appendChild(this.inputElement);

        if (this.data.type === "password") {
            const togglePasswordButtonElement: HTMLButtonElement = document.createElement("button");
            togglePasswordButtonElement.classList.add("toggle-password-button");
            togglePasswordButtonElement.textContent = "e";
            this.fieldContainerElement.appendChild(togglePasswordButtonElement);

            togglePasswordButtonElement.addEventListener("click", () => {
                this.inputElement.type = this.inputElement.type === "password" ? "text" : "password";
                togglePasswordButtonElement.textContent = this.inputElement.type === "password" ? "e" : "ɇ";
            });
        }

        if (this.data.minLength !== undefined) {
            this.inputElement.minLength = this.data.minLength;
        }
        if (this.data.maxLength !== undefined) {
            this.inputElement.maxLength = this.data.maxLength;
        }

        if (this.data.onChange !== undefined) {
            this.inputElement.addEventListener("input", () => this.data.onChange!(this.modal, this.getValue()));
        }

        this.setValue(this.data.defaultValue ?? "");
    }

    public override setValue(value: string | null): void {
        this.inputElement.value = value ?? "";
        this.inputElement.dispatchEvent(new Event("input"));
    }

    public override getMinLength(): number | null {
        return this.data.minLength ?? 0;
    }

    public override getValueLength(): number | null {
        return this.inputElement.value.length;
    }

    public override getErrorElement(): HTMLElement {
        return this.inputElement;
    }
    
    public override getMainElement(): HTMLInputElement {
        return this.inputElement;    
    }

    public override getValue(): string | null {
        return (this.inputElement.value !== "") ? this.inputElement.value : null;
    }

    public override isMandatory(): boolean {
        return this.data.mandatory ?? true;
    }

    public override isFocused(): boolean {
        return document.activeElement === this.inputElement;
    }

    public override async isConditionValid(value: string | null): Promise<boolean> {
        const defaultRes: boolean = await super.isConditionValid(value);
        if (!defaultRes) {
            return false;
        }

        if (this.data.type === "email") {
            const isEmailValid: boolean = (/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(value ?? "");
            if (!isEmailValid) {
                return false;
            }
        }

        return true;
    }
};

class InputListModalField extends ModalField<InputListValue, ModalInputListFieldData, HTMLInputListElement> {
    private readonly inputListElement: HTMLInputListElement;

    public constructor(modal: Modal, private readonly data: ModalInputListFieldData) {
        super(modal, data);

        this.inputListElement = document.createElement("input-list") as HTMLInputListElement;
        this.inputListElement.smartSearch = true;
        this.inputListElement.inputElement.placeholder = this.data.placeholder ?? "";
        this.inputListElement.data = this.data.data;
        this.fieldContainerElement.appendChild(this.inputListElement);

        if (this.data.onChange !== undefined) {
            this.inputListElement.addEventListener("change", () => this.data.onChange!(this.modal, this.getValue()));
        }

        this.setValue(ModalField.getDataValue(this.data.data, this.data.defaultValue ?? null));
    }

    public override setValue(value: InputListValue | null): void {
        this.inputListElement.value = value;
    }

    public override getErrorElement(): HTMLElement {
        return this.inputListElement.inputElement;
    }
    
    public override getMainElement(): HTMLInputListElement {
        return this.inputListElement;    
    }

    public override getValue(): InputListValue | null {
        return this.inputListElement.value;
    }

    public override isMandatory(): boolean {
        return this.data.mandatory ?? true;
    }

    public override isFocused(): boolean {
        return this.inputListElement.isFocused;
    }
};

class SelectModalField extends ModalField<InputListValue, ModalSelectFieldData, HTMLSelectElement> {
    private readonly selectElement: HTMLSelectElement;

    public constructor(modal: Modal, private readonly data: ModalSelectFieldData) {
        super(modal, data);

        if (this.data.data.length === 0) {
            throw new Error(`Could not create modal select field: Data is empty.`);
        }

        this.selectElement = document.createElement("select");
        this.fieldContainerElement.appendChild(this.selectElement);

        this.data.data.forEach((option: InputListValue) => {
            const optionElement: HTMLOptionElement = document.createElement("option");
            optionElement.value = String(option.id);
            optionElement.textContent = option.name;
            this.selectElement.appendChild(optionElement);
        });

        if (this.data.onChange !== undefined) {
            this.selectElement.addEventListener("change", () => this.data.onChange!(this.modal, this.getValue()));
        }

        const defaultValue: InputListValue = this.data.data.find((v: InputListValue) => v.id === this.data.defaultValue) ?? this.data.data[0];
        this.setValue(defaultValue);
    }

    public override setValue(value: InputListValue | null): void {
        if (value === null) {
            return;
        }

        this.selectElement.value = String(value.id);
    }

    public override getErrorElement(): HTMLElement {
        return this.selectElement;
    }

    public override getMainElement(): HTMLSelectElement {
        return this.selectElement;
    }

    public override getValue(): InputListValue | null {
        return this.data.data.find((v: InputListValue) => String(v.id) === this.selectElement.value) ?? null;
    }

    public override isMandatory(): boolean {
        return true;
    }

    public override isFocused(): boolean {
        return document.activeElement === this.selectElement;
    }
}

class UnfilteredListModalField extends ModalField<string[], ModalUnfilteredSmartListFieldData, HTMLSmartListElement> {
    private readonly smartListElement: HTMLSmartListElement;

    public constructor(modal: Modal, private readonly data: ModalUnfilteredSmartListFieldData) {
        super(modal, data);

        this.smartListElement = document.createElement("smart-list") as HTMLSmartListElement;
        this.smartListElement.smartSearch = true;
        this.smartListElement.inputListElement.inputElement.placeholder = this.data.placeholder ?? "";
        this.fieldContainerElement.appendChild(this.smartListElement);

        if (this.data.onChange !== undefined) {
            this.smartListElement.addEventListener("list-change", () => this.data.onChange!(this.modal, this.getValue()));
        }

        this.setValue(this.data.defaultValues ?? []);
    }

    public override setValue(value: string[] | null): void {
        this.smartListElement.values = value ?? [];
    }

    public override getErrorElement(): HTMLElement {
        return this.smartListElement.inputListElement.inputElement;
    }
    
    public override getMainElement(): HTMLSmartListElement {
        return this.smartListElement;    
    }

    public override getValue(): string[] | null {
        return (this.smartListElement.values.length !== 0) ? this.smartListElement.values : null;
    }

    public override isMandatory(): boolean {
        return this.data.mandatory ?? true;
    }

    public override isFocused(): boolean {
        return this.smartListElement.isFocused;
    }
};

class FilteredListModalField extends ModalField<InputListValue[], ModalFilteredSmartListFieldData, HTMLSmartListElement> {
    private readonly smartListElement: HTMLSmartListElement;

    public constructor(modal: Modal, private readonly data: ModalFilteredSmartListFieldData) {
        super(modal, data);

        this.smartListElement = document.createElement("smart-list") as HTMLSmartListElement;
        this.smartListElement.smartSearch = true;
        this.smartListElement.data = this.data.data;
        this.smartListElement.inputListElement.inputElement.placeholder = this.data.placeholder ?? "";
        this.fieldContainerElement.appendChild(this.smartListElement);

        if (this.data.onInvalidAdd !== undefined) {
            this.smartListElement.onInvalidAdd = async (query: string) => await this.data.onInvalidAdd!(query);
        }

        if (this.data.onChange !== undefined) {
            this.smartListElement.addEventListener("list-change", () => this.data.onChange!(this.modal, this.getValue()));
        }

        this.setValue(ModalField.getDataValues(this.data.data, this.data.defaultValues ?? []));
    }

    public override setValue(value: InputListValue[] | null): void {
        this.smartListElement.valuesFromData = value ?? [];
    }

    public override getErrorElement(): HTMLElement {
        return this.smartListElement.inputListElement.inputElement;
    }
    
    public override getMainElement(): HTMLSmartListElement {
        return this.smartListElement;    
    }

    public override getValue(): InputListValue[] | null {
        return (this.smartListElement.valuesFromData.length !== 0) ? this.smartListElement.valuesFromData : null;
    }

    public override isMandatory(): boolean {
        return this.data.mandatory ?? true;
    }

    public override isFocused(): boolean {
        return this.smartListElement.isFocused;
    }
};

class RadioModalField extends ModalField<InputListValue, ModalRadioFieldData, void> {
    private readonly radiosContainerElement: HTMLUListElement;
    private readonly radioElements: HTMLInputElement[];
    private value: InputListValue;

    public constructor(modal: Modal, private readonly data: ModalRadioFieldData) {
        super(modal, data);

        const errorBase: string = "Could not create modal radio field";

        if (this.data.data.length === 0) {
            throw new Error(`${errorBase}: Data is empty.`);
        }

        this.radiosContainerElement = document.createElement("ul");
        this.radiosContainerElement.classList.add("radios-container");
        this.fieldContainerElement.appendChild(this.radiosContainerElement);

        const defaultValueId: ID = this.data.defaultValue ?? this.data.data[0].id;

        const defaultValue: InputListValue | null = ModalField.getDataValue(this.data.data, defaultValueId);
        if (defaultValue === null) {
            throw new Error(`${errorBase}: Default value with is = "${this.data.defaultValue}" is invalid.`);
        }

        this.radioElements = this.data.data.map<HTMLInputElement>((value: InputListValue, index: number) => {
            const radioContainerElement: HTMLLIElement = document.createElement("li");
            radioContainerElement.classList.add("radio-container");
            this.radiosContainerElement.appendChild(radioContainerElement);

            const id: string = `${this.data.id}-${index + 1}`;

            const labelElement: HTMLLabelElement = document.createElement("label");
            labelElement.textContent = value.name;
            labelElement.htmlFor = id;
            radioContainerElement.appendChild(labelElement);

            const inputElement: HTMLInputElement = Functions.Elements.createInput("radio", this.data.id);
            inputElement.id = id;
            inputElement.checked = (value.id === defaultValue.id);
            radioContainerElement.appendChild(inputElement);

            inputElement.addEventListener("change", () => this.onChange(value));

            return inputElement;
        });

        this.value = defaultValue;
        this.setValue(this.value);
    }

    private onChange(v: InputListValue): void {
        this.value = { ...v };

        if (this.data.onChange !== undefined) {
            this.data.onChange(this.modal, this.getValue());
        }
    };

    public override setValue(value: InputListValue | null): void {
        const setErrorBase: string = "Could not set radio field value";

        if (value === null) {
            console.error(`${setErrorBase}: Value can't be null.`);
            return;
        }

        const valueIndex: number = this.data.data.findIndex((d: InputListValue) => d.id === value.id && d.name === value.name);
        const radioElement: HTMLInputElement | null = this.radioElements[valueIndex] ?? null;
        if (radioElement === null) {
            console.error(`${setErrorBase}: Value with id = "${value.id}" and name = "${value.name}" is invalid.`);
            return;
        }

        radioElement.checked = true;
        radioElement.dispatchEvent(new Event("change"));
    }

    public override getErrorElement(): HTMLElement {
        return this.radiosContainerElement;
    }
    
    public override getMainElement(): void {}

    public override getValue(): InputListValue | null {
        return this.value;
    }

    public override isMandatory(): boolean {
        return true;
    }

    public override isFocused(): boolean {
        return false;
    }
};

class MultiRadioModalField extends ModalField<InputListValue[], ModalMultiRadioFieldData, void> {
    private readonly radiosContainerElement: HTMLUListElement;
    private readonly radioElements: HTMLInputElement[];
    private readonly values: Set<InputListValue> = new Set<InputListValue>();

    public constructor(modal: Modal, private readonly data: ModalMultiRadioFieldData) {
        super(modal, data);

        this.radiosContainerElement = document.createElement("ul");
        this.radiosContainerElement.classList.add("radios-container");
        this.fieldContainerElement.appendChild(this.radiosContainerElement);

        this.radioElements = this.data.data.map<HTMLInputElement>((value: InputListValue, index: number) => {
            const radioContainerElement: HTMLLIElement = document.createElement("li");
            radioContainerElement.classList.add("radio-container");
            this.radiosContainerElement.appendChild(radioContainerElement);

            const id: string = `${this.data.id}-${index + 1}`;

            const labelElement: HTMLLabelElement = document.createElement("label");
            labelElement.textContent = value.name;
            labelElement.htmlFor = id;
            radioContainerElement.appendChild(labelElement);

            const inputElement: HTMLInputElement = Functions.Elements.createInput("checkbox", this.data.id);
            inputElement.id = id;
            radioContainerElement.appendChild(inputElement);

            inputElement.addEventListener("change", () => this.onChange(inputElement, value));

            return inputElement;
        });

        this.setValue(ModalField.getDataValues(this.data.data, this.data.defaultValues ?? []));
    }

    private onChange(inputElement: HTMLInputElement, value: InputListValue): void {
        const checked: boolean = inputElement.checked;
        (checked) ? this.values.add(value) : this.values.delete(value);

        if (this.data.onChange !== undefined) {
            this.data.onChange(this.modal, this.getValue());
        }
    }

    public override setValue(value: InputListValue[] | null): void {
        value = value ?? [];

        const radioElement: HTMLInputElement | null = this.data.data.reduce((acc: HTMLInputElement | null, d: InputListValue, index: number) => {
            const radioElement: HTMLInputElement | null = this.radioElements[index] ?? null;
            if (radioElement === null) {
                console.error(`Could not set multi radio field values: Radio element is null.`);
                return acc;
            }

            const hasToBeChecked: boolean = value.some((v: InputListValue) => v.id === d.id && v.name === d.name);
            (hasToBeChecked) ? this.values.add(d) : this.values.delete(d);

            radioElement.checked = hasToBeChecked;

            return radioElement;
        }, null);

        radioElement?.dispatchEvent(new Event("change"));
    }

    public override getErrorElement(): HTMLElement {
        return this.radiosContainerElement;
    }
    
    public override getMainElement(): void {}

    public override getValue(): InputListValue[] | null {
        return this.values.size !== 0 ? [...this.values] : null;
    }

    public override isMandatory(): boolean {
        return this.data.mandatory ?? true;
    }

    public override isFocused(): boolean {
        return false;
    }
};

class TextareaModalField extends ModalField<string, ModalTextareaFieldData, HTMLTextAreaElement> {
    private readonly textareaElement: HTMLTextAreaElement;

    public constructor(modal: Modal, private readonly data: ModalTextareaFieldData) {
        super(modal, data);

        this.textareaElement = document.createElement("textarea");
        this.textareaElement.autocomplete = "off";
        this.textareaElement.autocapitalize = "off";
        this.textareaElement.spellcheck = false;
        this.textareaElement.autocorrect = false;
        this.textareaElement.placeholder = this.data.placeholder ?? "";
        this.textareaElement.name = this.data.id;
        this.fieldContainerElement.appendChild(this.textareaElement);

        if (this.data.minLength !== undefined) {
            this.textareaElement.minLength = this.data.minLength;
        }
        if (this.data.maxLength !== undefined) {
            this.textareaElement.maxLength = this.data.maxLength;
        }

        if (this.data.onChange !== undefined) {
            this.textareaElement.addEventListener("input", () => this.data.onChange!(this.modal, this.getValue()));
        }

        this.setValue(this.data.defaultValue ?? "");
    }

    public override setValue(value: string | null): void {
        this.textareaElement.value = value ?? "";
        this.textareaElement.dispatchEvent(new Event("input"));
    }

    public override getMinLength(): number | null {
        return this.data.minLength ?? 0;
    }

    public override getValueLength(): number | null {
        return this.textareaElement.value.length;
    }

    public override getErrorElement(): HTMLElement {
        return this.textareaElement;
    }
    
    public override getMainElement(): HTMLTextAreaElement {
        return this.textareaElement;
    }

    public override getValue(): string | null {
        return (this.textareaElement.value !== "") ? this.textareaElement.value : null;
    }

    public override isMandatory(): boolean {
        return this.data.mandatory ?? true;
    }

    public override isFocused(): boolean {
        return document.activeElement === this.textareaElement;
    }
};

class CheckboxModalField extends ModalField<boolean, ModalCheckboxFieldData, HTMLInputElement> {
    private readonly inputElement: HTMLInputElement;

    public constructor(modal: Modal, private readonly data: ModalCheckboxFieldData) {
        super(modal, data);

        const checkboxContainerElement: HTMLElement = document.createElement("div");
        checkboxContainerElement.classList.add("checkbox-container");
        this.fieldContainerElement.appendChild(checkboxContainerElement);

        this.inputElement = Functions.Elements.createInput("checkbox", this.data.id);
        checkboxContainerElement.appendChild(this.inputElement);

        if (this.data.onChange !== undefined) {
            this.inputElement.addEventListener("input", () => this.data.onChange!(this.modal, this.getValue()));
        }

        this.setValue(this.data.defaultValue ?? false);
    }

    public override setValue(value: boolean | null): void {
        this.inputElement.checked = value ?? false;
        this.inputElement.dispatchEvent(new Event("input"));
    }

    public override getErrorElement(): HTMLElement {
        return this.inputElement;
    }
    
    public override getMainElement(): HTMLInputElement {
        return this.inputElement;    
    }

    public override getValue(): boolean | null {
        return this.inputElement.checked;
    }

    public override isMandatory(): boolean {
        return true;
    }

    public override isFocused(): boolean {
        return document.activeElement === this.inputElement;
    }
};

class DateModalField extends ModalField<string, ModalDateFieldData, HTMLInputElement> {
    private readonly inputElement: HTMLInputElement;

    public constructor(modal: Modal, private readonly data: ModalDateFieldData) {
        super(modal, data);

        const containerElement: HTMLElement = document.createElement("div");
        containerElement.classList.add("date-container");
        this.fieldContainerElement.appendChild(containerElement);

        this.inputElement = Functions.Elements.createInput("date", this.data.id);
        containerElement.appendChild(this.inputElement);

        const buttonsContainerElement: HTMLElement = document.createElement("div");
        buttonsContainerElement.classList.add("buttons-container");
        containerElement.appendChild(buttonsContainerElement);

        const todayButtonElement: HTMLButtonElement = document.createElement("button");
        todayButtonElement.textContent = "T";
        buttonsContainerElement.appendChild(todayButtonElement);

        todayButtonElement.addEventListener("click", () => this.setValue(Functions.Dates.toStringUS(new Date())));

        const removeValueButton: HTMLButtonElement = document.createElement("button");
        removeValueButton.textContent = "✖";
        buttonsContainerElement.appendChild(removeValueButton);

        removeValueButton.addEventListener("click", () => this.setValue(""));

        const calenderButtonElement: HTMLButtonElement = document.createElement("button");
        calenderButtonElement.textContent = "C";
        buttonsContainerElement.appendChild(calenderButtonElement);

        calenderButtonElement.addEventListener("click", () => this.inputElement.showPicker());

        if (this.data.onChange !== undefined) {
            this.inputElement.addEventListener("change", () => this.data.onChange!(this.modal, this.getValue()));
        }

        this.setValue(this.data.defaultValue ?? "");
    }

    public override setValue(value: string | null): void {
        this.inputElement.value = value ?? "";
        this.inputElement.dispatchEvent(new Event("change"));
    }

    public override getErrorElement(): HTMLElement {
        return this.inputElement;
    }
    
    public override getMainElement(): HTMLInputElement {
        return this.inputElement;    
    }

    public override getValue(): string | null {
        return (this.inputElement.value !== "") ? this.inputElement.value : null;
    }

    public override isMandatory(): boolean {
        return this.data.mandatory ?? true;
    }

    public override isFocused(): boolean {
        return document.activeElement === this.inputElement;
    }
};

class PictureModalField extends ModalField<string, ModalPictureFieldData, void> {
    private readonly pictureElement: HTMLElement;
    private value: string | null;

    public constructor(modal: Modal, private readonly data: ModalPictureFieldData, private readonly setCanClose: (value: boolean) => void) {
        super(modal, data);

        this.pictureElement = document.createElement("div");
        this.pictureElement.classList.add("picture");
        this.pictureElement.style.aspectRatio = data.aspectRatio;
        this.pictureElement.tabIndex = 0;
        this.fieldContainerElement.appendChild(this.pictureElement);

        this.initEvents();

        this.value = this.data.defaultValue ?? null;
        this.setValue(data.defaultValue ?? null);
    }

    public override destruct(): void {
        window.removeEventListener("keydown", this.onKeydown);
    }

    private initEvents(): void {
        window.addEventListener("keydown", this.onKeydown);

        this.pictureElement.addEventListener("click", () => Functions.Elements.antiSpam<void>(this.pictureElement, async () => {
            await this.onPictureElementClick();
        }));
    }

    private onKeydown = async (e: KeyboardEvent): Promise<void> => {
        const isPaste: boolean = (e.key.toLowerCase() == "v" && e.ctrlKey && !e.altKey && !e.shiftKey);
        if (!isPaste) {
            return;
        }

        const items: ClipboardItems = await navigator.clipboard.read();
        
        const hasImage: boolean = items.some((item: ClipboardItem) => item.types.some((type: string) => type.startsWith("image/")));
        if (!hasImage) {
            return;
        }

        const pasteClipbordImageReqRes: PasteClipbordImageApiResult = await Api.Temp.pasteClipbordImage();
        if (!pasteClipbordImageReqRes.success) {
            throw new Error(pasteClipbordImageReqRes.error);
        }

        this.value = pasteClipbordImageReqRes.filePath;
        this.setValue(pasteClipbordImageReqRes.filePath);
    }

    private async onPictureElementClick(): Promise<void> {
        this.setCanClose(false);
        const askForPictureReqRes: AskForFileApiResult = await Api.Dialog.askForFile("Select a thumbnail", "Images", ["png", "jpg", "jpeg", "bmp", "webp", "jfif"]);
        this.setCanClose(true);

        if (!askForPictureReqRes.success) {
            throw new Error(askForPictureReqRes.error);
        }

        const thumbnailFileName: string | null = askForPictureReqRes.path;
        this.setValue(thumbnailFileName);
    }

    public override setValue(value: string | null): void {
        value = (value ?? "").replace(/\\/g, "/");
        this.pictureElement.style.backgroundImage = (value === "" || value.endsWith("/")) ? "" : `url("${value}")`;

        const oldValue: string | null = this.value;
        this.value = value;

        if (oldValue !== value && this.data.onChange !== undefined) {
            this.data.onChange(this.modal, this.getValue());
        }
    }

    public override getErrorElement(): HTMLElement {
        return this.pictureElement;
    }
    
    public override getMainElement(): void {}

    public override getValue(): string | null {
        return (this.value !== "") ? this.value : null;
    }

    public override isMandatory(): boolean {
        return this.data.mandatory ?? true;
    }

    public override isFocused(): boolean {
        return false;
    }
};

class FileModalField extends ModalField<string, ModalFileFieldData, HTMLElement> {
    private readonly fileInputELement: HTMLElement;
    private value: string | null;

    public constructor(modal: Modal, private readonly data: ModalFileFieldData, private readonly setCanClose: (value: boolean) => void) {
        super(modal, data);

        this.fileInputELement = document.createElement("div");
        this.fileInputELement.classList.add("file-input");
        this.fileInputELement.tabIndex = 0;
        this.fileInputELement.textContent = data.fileZoneText;
        this.fieldContainerElement.appendChild(this.fileInputELement);

        this.initEvents();

        this.value = this.data.defaultValue ?? null;
        this.setValue(data.defaultValue ?? null);
    }

    private initEvents(): void {
        this.fileInputELement.addEventListener("click", () => Functions.Elements.antiSpam<void>(this.fileInputELement, async () => {
            await this.onFileInputElementClick();
        }));
    }

    private async onFileInputElementClick(): Promise<void> {
        this.setCanClose(false);
        const askForSongReqRes: AskForFileApiResult = await Api.Dialog.askForFile(this.data.dialogTitle, this.data.fileTypeName, this.data.extensions);
        this.setCanClose(true);

        if (!askForSongReqRes.success) {
            throw new Error(askForSongReqRes.error);
        }

        const thumbnailFileName: string | null = askForSongReqRes.path;
        this.setValue(thumbnailFileName);
    }

    public override setValue(value: string | null): void {
        this.value = value;
    }

    public override getErrorElement(): HTMLElement {
        return this.fileInputELement;
    }

    public override getMainElement(): HTMLElement {
        return this.fileInputELement;
    }

    public override getValue(): string | null {
        return (this.value !== "") ? this.value : null;
    }

    public override isMandatory(): boolean {
        return this.data.mandatory ?? true;
    }

    public override isFocused(): boolean {
        return document.activeElement === this.fileInputELement;
    }
}

export class Modal {
    private static readonly version: string = "1.23";
    private static readonly transitionDuration: number = Functions.Css.get("modal-transition-duration", "ms-duration");
    private static readonly openedClassName: string = "opened";
    private static readonly errorClassName: string = "error";

    private readonly wrapperElement: HTMLElement = document.createElement("div");
    protected readonly fieldsContainerElement: HTMLUListElement = document.createElement("ul");
    protected readonly containerElement: HTMLElement = document.createElement("div");
    protected readonly buttonContainerElement: HTMLElement = document.createElement("div");

    private errorMessageElements: HTMLParagraphElement[] = [];

    protected inputs: InputModalField[] = [];
    protected inputLists: InputListModalField[] = [];
    protected selects: SelectModalField[] = [];
    protected unfilteredSmartLists: UnfilteredListModalField[] = [];
    protected filteredSmartLists: FilteredListModalField[] = [];
    protected radios: RadioModalField[] = [];
    protected multiRadios: MultiRadioModalField[] = [];
    protected textareas: TextareaModalField[] = [];
    protected checkboxes: CheckboxModalField[] = [];
    protected dates: DateModalField[] = [];
    protected pictures: PictureModalField[] = [];
    protected files: FileModalField[] = [];

    protected canClose: boolean = true;

    // INIT
    constructor(private readonly title: string, private readonly onClose: (confirm: boolean) => void | Promise<void>, private readonly options?: ModalOptions) {
        this.wrapperElement.classList.add("modal-wrapper");
        document.body.appendChild(this.wrapperElement);

        if (!this.hasAnimations()) {
            this.wrapperElement.classList.add("no-animations");
        }

        setTimeout(() => this.wrapperElement.classList.add(Modal.openedClassName), 0);

        this.containerElement.tabIndex = 0;
        this.containerElement.classList.add("modal-container");
        this.wrapperElement.appendChild(this.containerElement);

        if (this.options?.className !== undefined) {
            this.containerElement.classList.add(this.options.className);
        }

        this.containerElement.focus();

        const titleElement: HTMLParagraphElement = document.createElement("h1");
        titleElement.classList.add("title");
        titleElement.textContent = this.title;
        this.containerElement.appendChild(titleElement);

        this.fieldsContainerElement.classList.add("fields-container");
        this.containerElement.appendChild(this.fieldsContainerElement);

        this.buttonContainerElement.classList.add("buttons-container");
        this.containerElement.appendChild(this.buttonContainerElement);

        const confirmButtonElement: HTMLButtonElement = document.createElement("button");
        confirmButtonElement.classList.add("confirm");
        confirmButtonElement.textContent = this.options?.confirmButtonText ?? "Confirm";
        this.buttonContainerElement.appendChild(confirmButtonElement);

        const cancelButtonElement: HTMLButtonElement = document.createElement("button");
        cancelButtonElement.classList.add("cancel");
        cancelButtonElement.textContent = this.options?.cancelButtonText ?? "Cancel";
        this.buttonContainerElement.appendChild(cancelButtonElement);

        let lastButtonElement: HTMLButtonElement = cancelButtonElement;

        options?.additionalButtons?.forEach((button: ModalAdditionalButton) => {
            const buttonElement: HTMLButtonElement = document.createElement("button");
            buttonElement.textContent = button.text;
            buttonElement.onclick = () => button.onClick(this);
            this.buttonContainerElement.appendChild(buttonElement);

            lastButtonElement = buttonElement;
        });

        if (options?.mandatory) {
            Functions.Elements.hide(cancelButtonElement);

            if (lastButtonElement === cancelButtonElement) {
                lastButtonElement = confirmButtonElement;
            }
        }

        lastButtonElement.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Tab" && !e.shiftKey && e.target === lastButtonElement) {
                setTimeout(() => this.containerElement.focus(), 10);
            }
        });

        this.containerElement.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Tab" && e.shiftKey && e.target === this.containerElement) {
                setTimeout(() => cancelButtonElement.focus(), 10);
            }
        });

        this.wrapperElement.addEventListener("mousedown", (e: MouseEvent) => {
            if ((e.target as HTMLElement) === this.wrapperElement) {
                this.softClose();
            }
        });

        confirmButtonElement.addEventListener("click", () => Functions.Elements.antiSpam<void>(confirmButtonElement, async () => await this.confirm()));
        cancelButtonElement.addEventListener("click", () => this.softClose());

        setTimeout(() => window.addEventListener("keydown", this.onKeydownEventHandler), 0);
    }

    // EVENTS
    private onKeydownEventHandler: (e: KeyboardEvent) => void = (e: KeyboardEvent) => {
        if (!this.isCurrentModal()) {
            return;
        }

        if (this.hasFocusedField()) {
            return;
        }

        if (e.key === "Escape") {
            this.softClose();
        }
        else if (e.key === "Enter") {
            this.confirm();
        }
    };
    
    private async confirm(): Promise<void> {
        this.clearErrors();

        const errors: number = await this.setFieldErrors();
        if (errors > 0) {
            return;
        }
        
        window.removeEventListener("keydown", this.onKeydownEventHandler);

        await this.onClose(true);
        this.wrapperElement.classList.remove(Modal.openedClassName);
        setTimeout(() => this.wrapperElement.remove(), (this.hasAnimations()) ? Modal.transitionDuration : 0);
    }

    private async softClose(force: boolean = false): Promise<void> {
        if (this.options?.mandatory && !force) {
            return;
        }

        if (!this.canClose) {
            return;
        }

        window.removeEventListener("keydown", this.onKeydownEventHandler);

        this.pictures.forEach((picture: PictureModalField) => picture.destruct());

        await this.onClose(false);
        this.wrapperElement.classList.remove(Modal.openedClassName);
        setTimeout(() => this.wrapperElement.remove(), (this.hasAnimations()) ? Modal.transitionDuration : 0);
    }

    // OTHER
    private clearErrors(): void {
        this.errorMessageElements.forEach((errorMessageElement: HTMLParagraphElement) => errorMessageElement.remove());
        this.errorMessageElements = [];
        
        const getErrorElements = <V, D extends ModalFieldChildData<V>, E extends HTMLElement | void>(fields: ModalField<V, D, E>[]) => fields.map<HTMLElement>((f: ModalField<V, D, E>) => f.getErrorElement());

        const inputErrorElements: HTMLElement[] = getErrorElements(this.inputs);
        const inputListErrorElements: HTMLElement[] = getErrorElements(this.inputLists);
        const selectErrorElements: HTMLElement[] = getErrorElements(this.selects);
        const unfilteredSmartListErrorElements: HTMLElement[] = getErrorElements(this.unfilteredSmartLists);
        const filteredSmartListErrorElements: HTMLElement[] = getErrorElements(this.filteredSmartLists);
        const radioErrorElements: HTMLElement[] = getErrorElements(this.radios);
        const multiRadioErrorElements: HTMLElement[] = getErrorElements(this.multiRadios);
        const textareaErrorElements: HTMLElement[] = getErrorElements(this.textareas);
        const checkboxErrorElements: HTMLElement[] = getErrorElements(this.checkboxes);
        const dateErrorElements: HTMLElement[] = getErrorElements(this.dates);
        const pictureErrorElements: HTMLElement[] = getErrorElements(this.pictures);
        const fileErrorElements: HTMLElement[] = getErrorElements(this.files);

        const errorElements: HTMLElement[] = inputErrorElements.concat(
            inputListErrorElements,
            selectErrorElements,
            unfilteredSmartListErrorElements,
            filteredSmartListErrorElements,
            radioErrorElements,
            multiRadioErrorElements,
            textareaErrorElements,
            checkboxErrorElements,
            dateErrorElements,
            pictureErrorElements,
            fileErrorElements,
        );

        errorElements.forEach((errorElement: HTMLElement) => errorElement.classList.remove(Modal.errorClassName));
    }

    private async hasFieldAnError<V, D extends ModalFieldChildData<V>, E extends HTMLElement | void>(field: ModalField<V, D, E>, fieldValue: V | null): Promise<boolean> {
        const minLength: number | null = field.getMinLength();
        const valueLength: number | null = field.getValueLength();

        if (minLength !== null && valueLength !== null) {
            if (minLength > valueLength) {
                return true;
            }
        }

        if (field.isMandatory()) {
            if (fieldValue === null) {
                return true;
            }

            const isConditionValid: boolean = (field.isConditionValid !== undefined) ? await field.isConditionValid(fieldValue) : true;
            if (!isConditionValid) {
                return true;
            }
        }
        else if (field.isConditionValid !== undefined) {
            if (!field.isConditionValid(fieldValue)) {
                return true;
            }
        }

        return false;
    }

    private setFieldElementError<V, D extends ModalFieldChildData<V>, E extends HTMLElement | void>(field: ModalField<V, D, E>): void {
        field.getErrorElement().classList.add(Modal.errorClassName);
    }

    private setFieldErrorMessage(containerElement: HTMLLIElement, message: string | null): void {
        if (message === null) {
            return;
        }

        const errorMesssageElement: HTMLParagraphElement = document.createElement("p");
        errorMesssageElement.classList.add("error-message");
        errorMesssageElement.textContent = message ?? "";
        containerElement.appendChild(errorMesssageElement);

        this.errorMessageElements.push(errorMesssageElement);
    }

    protected async setFieldErrorsHandler<V, D extends ModalFieldChildData<V>, E extends HTMLElement | void>(field: ModalField<V, D, E>): Promise<boolean> {
        const fieldValue: V | null = field.getValue();
        const fieldContainerElement: HTMLLIElement = field.getFieldContainerElement();
        const fieldName: string = Functions.Strings.capitalize(field.getData().name ?? "field");

        const hasError: boolean = await this.hasFieldAnError<V, D, E>(field, fieldValue);
        let hasErrorMessage: boolean = false;

        if (hasError) {
            this.setFieldElementError(field);
        }

        if (hasError && field.errorMessage !== undefined) {
            const errorMessageStr: string | null = field.errorMessage(fieldValue);
            this.setFieldErrorMessage(fieldContainerElement, errorMessageStr);
            hasErrorMessage = errorMessageStr !== null;
        }

        if (hasError && !hasErrorMessage && field.getValue() === null && this.options?.errorMessageOnMandatoryEmptyFields) {
            this.setFieldErrorMessage(fieldContainerElement, `${fieldName} is mandatory`);
            hasErrorMessage = true;
        }

        const fieldMinLength: number | null = field.getMinLength();
        const fieldValueLength: number | null = field.getValueLength();

        if (fieldMinLength !== null && fieldValueLength !== null && !hasErrorMessage) {
            if (fieldMinLength > fieldValueLength) {
                this.setFieldErrorMessage(fieldContainerElement, `${fieldName} needs no be at least ${fieldMinLength} ${Functions.Strings.pluralize("character", "characters", fieldMinLength)} long`);
                hasErrorMessage = true;
            }
        }

        return hasError;
    }

    private async setFieldsErrorsHandler<V, D extends ModalFieldChildData<V>, E extends HTMLElement | void>(fields: ModalField<V, D, E>[]): Promise<number> {
        let errorCount = 0;

        for (const field of fields) {
            const hasError: boolean = await this.setFieldErrorsHandler(field);

            if (hasError) {
                errorCount++;
            }
        }

        return errorCount;
    }

    private async setFieldErrors(): Promise<number> {
        const inputErrors: number = await this.setFieldsErrorsHandler(this.inputs);
        const inputListsErrors: number = await this.setFieldsErrorsHandler(this.inputLists);
        const selectErrors: number = await this.setFieldsErrorsHandler(this.selects);
        const unfilteredSmartListsErrors: number = await this.setFieldsErrorsHandler(this.unfilteredSmartLists);
        const filteredSmartListsErrors: number = await this.setFieldsErrorsHandler(this.filteredSmartLists);
        const radiosErrors: number = await this.setFieldsErrorsHandler(this.radios);
        const multiRadiosErrors: number = await this.setFieldsErrorsHandler(this.multiRadios);
        const textareasErrors: number = await this.setFieldsErrorsHandler(this.textareas);
        const checkboxesErrors: number = await this.setFieldsErrorsHandler(this.checkboxes);
        const datesErrors: number = await this.setFieldsErrorsHandler(this.dates);
        const picturesErrors: number = await this.setFieldsErrorsHandler(this.pictures);
        const filesErrors: number = await this.setFieldsErrorsHandler(this.files);

        return inputErrors +
            inputListsErrors +
            selectErrors +
            unfilteredSmartListsErrors +
            filteredSmartListsErrors +
            radiosErrors +
            multiRadiosErrors +
            textareasErrors +
            checkboxesErrors +
            datesErrors +
            picturesErrors +
            filesErrors;
    }

    private setFieldValue<V, D extends ModalFieldChildData<V>, E extends HTMLElement | void>(id: string, name: string, existsFieldCall: (id: string) => boolean, fields: ModalField<V, D, E>[], value: (field: ModalField<V, D, E>) => V | null): void {
        const errorMessage: string = `Could not set modal ${name.toLowerCase()} field value with id = "${id}": ${name} field with this id is null.`;

        if (!existsFieldCall(id)) {
            throw new Error(errorMessage);
        }

        const field: ModalField<V, D, E> | undefined = fields.find((f: ModalField<V, D, E>) => f.getId() === id);
        if (field === undefined) {
            throw new Error(errorMessage);
        }

        field.setValue(value(field));
    }

    private setFieldValueGetValue<V, D extends ModalFieldChildData<V> & { readonly data: InputListValue[] }, E extends HTMLElement | void>(field: ModalField<V, D, E>, value: ID | null, prefix: string): InputListValue | null {
        const fullValue: InputListValue | null = field.getData().data.find((d: InputListValue) => d.id === value) ?? null;
        if (fullValue === null && value !== null) {
            console.error(`Could not set ${prefix} field value: Value with id = "${value}" is invalid.`);
            return null;
        }

        return fullValue;
    }

    private setFieldValueGetValues<V, D extends ModalFieldChildData<V> & { readonly data: InputListValue[] }, E extends HTMLElement | void>(field: ModalField<V, D, E>, values: ID[] | null, prefix: string): InputListValue[] | null {
        const res: InputListValue[] = [];

        (values ?? []).forEach((v: ID) => {
            const fullValue: InputListValue | null = this.setFieldValueGetValue(field, v, prefix);
            if (fullValue === null) {
                return;
            }

            res.push(fullValue);
        });

        return res;
    }

    private getFieldValue<V, D extends ModalFieldChildData<V>, E extends HTMLElement | void>(id: string, name: string, existsFieldCall: (id: string) => boolean, fields: ModalField<V, D, E>[]): V | null {
        const errorMessage: string = `Could not get modal ${name.toLowerCase()} field value with id = "${id}": ${name} field with this id is null.`;

        if (!existsFieldCall(id)) {
            throw new Error(errorMessage);
        }

        const field: ModalField<V, D, E> | undefined = fields.find((f: ModalField<V, D, E>) => f.getId() === id);
        if (field === undefined) {
            throw new Error(errorMessage);
        }

        return field.getValue();
    }

    protected doesIdAlreadyExists(id: string): boolean {
        return this.doesInputIdAlreadyExists(id) ||
            this.doesInputListIdAlreadyExists(id) ||
            this.doesSelectIdAlreadyExists(id) ||
            this.doesUnfilteredSmartListIdAlreadyExists(id) ||
            this.doesFilteredSmartListIdAlreadyExists(id) ||
            this.doesRadioIdAlreadyExists(id) ||
            this.doesMultiRadioIdAlreadyExists(id) ||
            this.doesTextareaIdAlreadyExists(id) ||
            this.doesCheckboxIdAlreadyExists(id) ||
            this.doesDateIdAlreadyExists(id) ||
            this.doesPictureIdAlreadyExists(id) ||
            this.doesFileIdAlreadyExists(id);
    }

    private doesIdAlreadyExistsHandler<V, D extends ModalFieldChildData<V>, E extends HTMLElement | void>(fields: ModalField<V, D, E>[], id: string): boolean {
        return fields.some((f: ModalField<V, D, E>) => f.getId() === id);
    }

    private doesInputIdAlreadyExists(id: string): boolean {
        return this.doesIdAlreadyExistsHandler(this.inputs, id);
    }

    private doesInputListIdAlreadyExists(id: string): boolean {
        return this.doesIdAlreadyExistsHandler(this.inputLists, id);
    }

    private doesSelectIdAlreadyExists(id: string): boolean {
        return this.doesIdAlreadyExistsHandler(this.selects, id);
    }

    private doesUnfilteredSmartListIdAlreadyExists(id: string): boolean {
        return this.doesIdAlreadyExistsHandler(this.unfilteredSmartLists, id);
    }

    private doesFilteredSmartListIdAlreadyExists(id: string): boolean {
        return this.doesIdAlreadyExistsHandler(this.filteredSmartLists, id);
    }

    private doesRadioIdAlreadyExists(id: string): boolean {
        return this.doesIdAlreadyExistsHandler(this.radios, id);
    }

    private doesMultiRadioIdAlreadyExists(id: string): boolean {
        return this.doesIdAlreadyExistsHandler(this.multiRadios, id);
    }

    private doesTextareaIdAlreadyExists(id: string): boolean {
        return this.doesIdAlreadyExistsHandler(this.textareas, id);
    }

    private doesCheckboxIdAlreadyExists(id: string): boolean {
        return this.doesIdAlreadyExistsHandler(this.checkboxes, id);
    }

    private doesDateIdAlreadyExists(id: string): boolean {
        return this.doesIdAlreadyExistsHandler(this.dates, id);
    }

    private doesPictureIdAlreadyExists(id: string): boolean {
        return this.doesIdAlreadyExistsHandler(this.pictures, id);
    }

    private doesFileIdAlreadyExists(id: string): boolean {
        return this.doesIdAlreadyExistsHandler(this.files, id);
    }

    private hasFocusedField(): boolean {
        const hasFocusedFieldHandler = <V, D extends ModalFieldChildData<V>, E extends HTMLElement | void>(fields: ModalField<V, D, E>[]) => {
            return fields.some((f: ModalField<V, D, E>) => (f.isFocused === undefined) ? false : f.isFocused());
        }

        return hasFocusedFieldHandler(this.inputLists) || hasFocusedFieldHandler(this.unfilteredSmartLists) || hasFocusedFieldHandler(this.selects) || hasFocusedFieldHandler(this.filteredSmartLists);
    }

    private hasAnimations(): boolean {
        return this.options?.animations ?? true;
    }

    private isCurrentModal(): boolean {
        const modalElements: HTMLElement[] = [...document.querySelectorAll<HTMLElement>(".modal-wrapper")];
        const currentModalWrapperElement: HTMLElement | undefined = modalElements.reverse()[0];
        return (currentModalWrapperElement === undefined) ? false : (currentModalWrapperElement === this.wrapperElement);
    }

    // PUBLIC
    public async close(): Promise<void> {
        await this.softClose(true);
    }

    // PUBLIC-ADD-FIELD
    public addInputField(data: ModalInputFieldData): HTMLInputElement {
        if (this.doesIdAlreadyExists(data.id)) {
            throw new Error(`Could not create modal input field: Field with id = "${data.id}" already exists.`);
        }

        const inputField: InputModalField = new InputModalField(this, data);
        this.inputs.push(inputField);
        this.fieldsContainerElement.appendChild(inputField.getFieldContainerElement());

        return inputField.getMainElement();
    }

    public addInputListField(data: ModalInputListFieldData): HTMLInputListElement {
        const errorBase: string = "Could not create modal input list field";

        if (this.doesIdAlreadyExists(data.id)) {
            throw new Error(`${errorBase}: Field with id = "${data.id}" already exists.`);
        }

        if (data.data.length === 0) {
            throw new Error(`${errorBase}: Input list field must have data.`);
        }

        const inputListField: InputListModalField = new InputListModalField(this, data);
        this.inputLists.push(inputListField);
        this.fieldsContainerElement.appendChild(inputListField.getFieldContainerElement());

        return inputListField.getMainElement();
    }

    public addSelectField(data: ModalSelectFieldData): HTMLSelectElement {
        if (this.doesIdAlreadyExists(data.id)) {
            throw new Error(`Could not create modal select field: Field with id = "${data.id}" already exists.`);
        }

        const selectModalField: SelectModalField = new SelectModalField(this, data);
        this.selects.push(selectModalField);
        this.fieldsContainerElement.appendChild(selectModalField.getFieldContainerElement());

        return selectModalField.getMainElement();
    }

    public addUnfilteredSmartListField(data: ModalUnfilteredSmartListFieldData): HTMLSmartListElement {
        if (this.doesIdAlreadyExists(data.id)) {
            throw new Error(`Could not create modal unfiltered list field: Field with id = "${data.id}" already exists.`);
        }

        const unfilteredListField: UnfilteredListModalField = new UnfilteredListModalField(this, data);
        this.unfilteredSmartLists.push(unfilteredListField);
        this.fieldsContainerElement.appendChild(unfilteredListField.getFieldContainerElement());

        return unfilteredListField.getMainElement();
    }

    public addFilteredSmartListField(data: ModalFilteredSmartListFieldData): HTMLSmartListElement {
        const errorBase: string = "Could not create modal filtered list field";

        if (this.doesIdAlreadyExists(data.id)) {
            throw new Error(`${errorBase}: Field with id = "${data.id}" already exists.`);
        }

        if (data.data.length === 0) {
            throw new Error(`${errorBase}: Filtered list field must have data.`);
        }

        const filteredListField: FilteredListModalField = new FilteredListModalField(this, data);
        this.filteredSmartLists.push(filteredListField);
        this.fieldsContainerElement.appendChild(filteredListField.getFieldContainerElement());

        return filteredListField.getMainElement();
    }

    public addRadioField(data: ModalRadioFieldData): void {
        const errorBase: string = "Could not create modal radio field";

        if (this.doesIdAlreadyExists(data.id)) {
            throw new Error(`${errorBase}: Field with id = "${data.id}" already exists.`);
        }

        if (data.data.length === 0) {
            throw new Error(`${errorBase}: Radio field must have data.`);
        }

        const radioField: RadioModalField = new RadioModalField(this, data);
        this.radios.push(radioField);
        this.fieldsContainerElement.appendChild(radioField.getFieldContainerElement());
    }

    public addMultiRadioField(data: ModalMultiRadioFieldData): void {
        const errorBase: string = "Could not create modal multi radio field";

        if (this.doesIdAlreadyExists(data.id)) {
            throw new Error(`${errorBase}: Field with id = "${data.id}" already exists.`);
        }

        if (data.data.length === 0) {
            throw new Error(`${errorBase}: Radio field must have data.`);
        }

        const multiRadioField: MultiRadioModalField = new MultiRadioModalField(this, data);
        this.multiRadios.push(multiRadioField);
        this.fieldsContainerElement.appendChild(multiRadioField.getFieldContainerElement());
    }

    public addTextareaField(data: ModalTextareaFieldData): HTMLTextAreaElement {
        if (this.doesIdAlreadyExists(data.id)) {
            throw new Error(`Could not create modal textarea field: Field with id = "${data.id}" already exists.`);
        }

        const textareaField: TextareaModalField = new TextareaModalField(this, data);
        this.textareas.push(textareaField);
        this.fieldsContainerElement.appendChild(textareaField.getFieldContainerElement());

        return textareaField.getMainElement();
    }

    public addCheckboxField(data: ModalCheckboxFieldData): HTMLInputElement {
        if (this.doesIdAlreadyExists(data.id)) {
            throw new Error(`Could not create modal checkbox field: Field with id = "${data.id}" already exists.`);
        }

        const checkboxField: CheckboxModalField = new CheckboxModalField(this, data);
        this.checkboxes.push(checkboxField);
        this.fieldsContainerElement.appendChild(checkboxField.getFieldContainerElement());

        return checkboxField.getMainElement();
    }

    public addDateField(data: ModalDateFieldData): HTMLInputElement {
        if (this.doesIdAlreadyExists(data.id)) {
            throw new Error(`Could not create modal date field: Field with id = "${data.id}" already exists.`);
        }

        const dateField: DateModalField = new DateModalField(this, data);
        this.dates.push(dateField);
        this.fieldsContainerElement.appendChild(dateField.getFieldContainerElement());

        return dateField.getMainElement();
    }

    public addPictureField(data: ModalPictureFieldData): void {
        if (this.doesIdAlreadyExists(data.id)) {
            throw new Error(`Could not create modal picture field: Field with id = "${data.id}" already exists.`);
        }

        const pictureField: PictureModalField = new PictureModalField(this, data, (value: boolean) => this.canClose = value);
        this.pictures.push(pictureField);
        this.fieldsContainerElement.appendChild(pictureField.getFieldContainerElement());
    }

    public addFileField(data: ModalFileFieldData): void {
        if (this.doesIdAlreadyExists(data.id)) {
            throw new Error(`Could not create modal file field: Field with id = "${data.id}" already exists.`);
        }

        const fileField: FileModalField = new FileModalField(this, data, (value: boolean) => this.canClose = value);
        this.files.push(fileField);
        this.fieldsContainerElement.appendChild(fileField.getFieldContainerElement());
    }

    // PUBLIC-SET-FIELD-VALUE
    public setInputFieldValue(id: string, value: string): void {
        this.setFieldValue(id, "Input", (id: string) => this.doesInputIdAlreadyExists(id), this.inputs, () => value);
    }

    public setInputListFieldValue(id: string, value: ID | null): void {
        this.setFieldValue(id, "Input list", (id: string) => this.doesInputListIdAlreadyExists(id), this.inputLists, (field: ModalField<InputListValue, ModalInputListFieldData, HTMLInputListElement>) => {
            return this.setFieldValueGetValue(field, value, "input list");
        });
    }

    public setSelectFieldValue(id: string, value: ID): void {
        this.setFieldValue(id, "Select", (id: string) => this.doesSelectIdAlreadyExists(id), this.selects, (field: ModalField<InputListValue, ModalSelectFieldData, HTMLSelectElement>) => {
            return this.setFieldValueGetValue(field, value, "select");
        });
    }

    public setUnfileteredListFieldValues(id: string, values: string[]): void {
        this.setFieldValue(id, "Unfiltered list", (id: string) => this.doesUnfilteredSmartListIdAlreadyExists(id), this.unfilteredSmartLists, () => values);
    }

    public setFilteredListFieldValues(id: string, values: ID[]): void {
        this.setFieldValue(id, "Filtered list", (id: string) => this.doesFilteredSmartListIdAlreadyExists(id), this.filteredSmartLists, (field: ModalField<InputListValue[], ModalFilteredSmartListFieldData, HTMLSmartListElement>) => {
            return this.setFieldValueGetValues(field, values, "filtered list");
        });
    }

    public setRadioFieldValue(id: string, value: ID): void {
        this.setFieldValue(id, "Radio", (id: string) => this.doesRadioIdAlreadyExists(id), this.radios, (field: ModalField<InputListValue, ModalRadioFieldData, void>) => {
            return this.setFieldValueGetValue(field, value, "radio");
        });
    }

    public setMultiRadioFieldValues(id: string, values: ID[]): void {
        this.setFieldValue(id, "Multi radio", (id: string) => this.doesMultiRadioIdAlreadyExists(id), this.multiRadios, (field: ModalField<InputListValue[], ModalMultiRadioFieldData, void>) => {
            return this.setFieldValueGetValues(field, values, "multi radio");
        });
    }

    public setTextareaFieldValue(id: string, value: string): void {
        this.setFieldValue(id, "Textarea", (id: string) => this.doesTextareaIdAlreadyExists(id), this.textareas, () => value);
    }

    public setCheckboxFieldValue(id: string, value: boolean): void {
        this.setFieldValue(id, "Checkbox", (id: string) => this.doesCheckboxIdAlreadyExists(id), this.checkboxes, () => value);
    }

    public setDateFieldValue(id: string, value: string): void {
        this.setFieldValue(id, "Date", (id: string) => this.doesDateIdAlreadyExists(id), this.dates, () => value);
    }

    public setPictureFieldValue(id: string, value: string | null): void {
        this.setFieldValue(id, "Picture", (id: string) => this.doesPictureIdAlreadyExists(id), this.pictures, () => value);
    }

    public setFileFieldValue(id: string, value: string | null): void {
        this.setFieldValue(id, "File", (id: string) => this.doesFileIdAlreadyExists(id), this.files, () => value);
    }

    // PUBLIC-GET-FIELD-VALUE
    public getInputFieldValue(id: string): string {
        return this.getFieldValue(id, "Input", (id: string) => this.doesInputIdAlreadyExists(id), this.inputs) ?? "";
    }

    public getInputListFieldValue(id: string): InputListValue | null {
        return this.getFieldValue(id, "Input list", (id: string) => this.doesInputListIdAlreadyExists(id), this.inputLists);
    }

    public getSelectFieldValue(id: string): InputListValue | null {
        return this.getFieldValue(id, "Select", (id: string) => this.doesSelectIdAlreadyExists(id), this.selects);
    }

    public getUnfilteredSmartListFieldValue(id: string): string[] {
        return this.getFieldValue(id, "Unfiltered list", (id: string) => this.doesUnfilteredSmartListIdAlreadyExists(id), this.unfilteredSmartLists) ?? [];
    }

    public getFilteredSmartListFieldValue(id: string): InputListValue[] {
        return this.getFieldValue(id, "Filtered list", (id: string) => this.doesFilteredSmartListIdAlreadyExists(id), this.filteredSmartLists) ?? [];
    }

    public getRadioFieldValue(id: string): InputListValue | null {
        return this.getFieldValue(id, "Radio", (id: string) => this.doesRadioIdAlreadyExists(id), this.radios);
    }

    public getMultiRadioFieldValue(id: string): InputListValue[] {
        return this.getFieldValue(id, "Multi radio", (id: string) => this.doesMultiRadioIdAlreadyExists(id), this.multiRadios) ?? [];
    }

    public getTextareaFieldValue(id: string): string {
        return this.getFieldValue(id, "Textarea", (id: string) => this.doesTextareaIdAlreadyExists(id), this.textareas) ?? "";
    }

    public getCheckboxFieldValue(id: string): boolean {
        return this.getFieldValue(id, "Checkbox", (id: string) => this.doesCheckboxIdAlreadyExists(id), this.checkboxes) ?? false;
    }

    public getDateFieldValue(id: string): string {
        return this.getFieldValue(id, "Date", (id: string) => this.doesDateIdAlreadyExists(id), this.dates) ?? "";
    }

    public getPictureFieldValue(id: string): string | null {
        return this.getFieldValue(id, "Picture", (id: string) => this.doesPictureIdAlreadyExists(id), this.pictures);
    }

    public getFileFieldValue(id: string): string | null {
        return this.getFieldValue(id, "File", (id: string) => this.doesFileIdAlreadyExists(id), this.files);
    }
};

abstract class ModalTemplate<T> {
    // INIT
    public constructor(private readonly title: string, private readonly options?: ModalOptions) {}

    public async create(): Promise<T | null> {
        return new Promise<T | null>((resolve: Resolve<T | null>) => {
            const modal: Modal = this.createModal(resolve);
            this.createFields(modal);
        });
    }

    private createModal(resolve: Resolve<T | null>): Modal {
        const modal: Modal = new Modal(this.title, async (confirm: boolean) => await this.onClose(modal, resolve, confirm), this.options);
        return modal;
    }

    protected abstract createFields(modal: Modal): void;

    protected abstract onClose(modal: Modal, resolve: Resolve<T | null>, confirm: boolean): Promise<void>;
};

class TabModal extends Modal {
    private static readonly selectedClassName: string = "selected";

    private readonly tab1FieldsContainerElement: HTMLUListElement = document.createElement("ul");
    private readonly tab2FieldsContainerElement: HTMLUListElement = document.createElement("ul");

    private readonly tab1ButtonElement: HTMLButtonElement = document.createElement("button");
    private readonly tab2ButtonElement: HTMLButtonElement = document.createElement("button");

    private readonly tab1FieldIds: string[] = [];
    private readonly tab2FieldIds: string[] = [];

    private currentTabId: string;

    // INIT
    public constructor(private readonly tab1: TabModalTab, private readonly tab2: TabModalTab, onClose: (confirm: boolean) => void, options?: TabModalOptions) {
        super("", onClose, options);
        this.containerElement.classList.add("tab-modal");

        this.initHeader();
        this.initTabs();

        this.containerElement.appendChild(this.buttonContainerElement);

        this.currentTabId = options?.defaultTabId ?? tab1.id;
        this.onTabButtonClick(this.currentTabId);
    }

    private initHeader(): void {
        const headerElement: HTMLElement = document.createElement("header");
        headerElement.classList.add("tab-buttons-container");
        this.containerElement.appendChild(headerElement);

        this.tab1ButtonElement.textContent = this.tab1.title;
        headerElement.appendChild(this.tab1ButtonElement);

        this.tab1ButtonElement.addEventListener("click", () => this.onTabButtonClick(this.tab1.id));

        this.tab2ButtonElement.textContent = this.tab2.title;
        headerElement.appendChild(this.tab2ButtonElement);

        this.tab2ButtonElement.addEventListener("click", () => this.onTabButtonClick(this.tab2.id));
    }

    private initTabs(): void {
        this.tab1FieldsContainerElement.classList.add("fields-container", "tab-modal");
        this.containerElement.appendChild(this.tab1FieldsContainerElement);

        this.tab2FieldsContainerElement.classList.add("fields-container", "tab-modal");
        this.containerElement.appendChild(this.tab2FieldsContainerElement);
    }

    // EVENTS
    private onTabButtonClick(tabId: string): void {
        if (tabId !== this.tab1.id && tabId !== this.tab2.id) {
            throw new Error(`Could not open tab: Tab with id = "${tabId}" is null.`);
        }

        Functions.Elements.hide(this.tab1FieldsContainerElement, this.tab2FieldsContainerElement);
        const tabFieldsContainerElement: HTMLUListElement = (tabId === this.tab1.id) ? this.tab1FieldsContainerElement : this.tab2FieldsContainerElement;
        Functions.Elements.show(tabFieldsContainerElement);

        this.tab1ButtonElement.classList.remove(TabModal.selectedClassName);
        this.tab2ButtonElement.classList.remove(TabModal.selectedClassName);
        const tabButtonElement: HTMLButtonElement = (tabId === this.tab1.id) ? this.tab1ButtonElement : this.tab2ButtonElement;
        tabButtonElement.classList.add(TabModal.selectedClassName);

        this.currentTabId = tabId;
    }

    // OTHER
    private appendFieldContainerElementInTab<V, D extends ModalFieldChildData<V>, E extends HTMLElement | void>(fields: ModalField<V, D, E>[], fieldId: string, tabId: string): void {
        const errorBase: string = "Could not add field in tab modal";

        if (tabId !== this.tab1.id && tabId !== this.tab2.id) {
            throw new Error(`${errorBase}: Tab with id = "${tabId}" is null.`);
        }

        const field: ModalField<V, D, E> | null = fields.find((field: ModalField<V, D, E>) => field.getData().id === fieldId) ?? null;
        if (field === null) {
            throw new Error(`${errorBase}: Field was not added in modal.`);
        }

        const tabFieldIds: string[] = (tabId === this.tab1.id) ? this.tab1FieldIds : this.tab2FieldIds;
        tabFieldIds.push(field.getId());

        const tabFieldsContainerContainerElement: HTMLUListElement = (tabId === this.tab1.id) ? this.tab1FieldsContainerElement : this.tab2FieldsContainerElement;
        tabFieldsContainerContainerElement.appendChild(field.getFieldContainerElement());
    }

    protected override async setFieldErrorsHandler<V, D extends ModalFieldChildData<V>, E extends HTMLElement | void>(field: ModalField<V, D, E>): Promise<boolean> {
        if (this.currentTabId !== this.tab1.id && this.currentTabId !== this.tab2.id) {
            throw new Error(`Could not set field errors: Tab with id = "${this.currentTabId}" is null.`);
        }

        const tabFieldIds: string[] = (this.currentTabId === this.tab1.id) ? this.tab1FieldIds : this.tab2FieldIds;

        const isFieldInCurrentTab: boolean = tabFieldIds.includes(field.getId());
        return (isFieldInCurrentTab) ? super.setFieldErrorsHandler(field) : false;
    }

    // PUBLIC-ADD-FIELD
    public override addInputField(data: TabModalInputFieldData): HTMLInputElement {
        const res: HTMLInputElement = super.addInputField(data);
        this.appendFieldContainerElementInTab(this.inputs, data.id, data.tabId);
        return res;
    }

    public override addInputListField(data: TabModalInputListFieldData): HTMLInputListElement {
        const res: HTMLInputListElement = super.addInputListField(data);
        this.appendFieldContainerElementInTab(this.inputLists, data.id, data.tabId);
        return res;
    }

    public override addSelectField(data: TabModalSelectFieldData): HTMLSelectElement {
        const res: HTMLSelectElement = super.addSelectField(data);
        this.appendFieldContainerElementInTab(this.selects, data.id, data.tabId);
        return res;
    }

    public override addUnfilteredSmartListField(data: TabModalUnfilteredSmartListFieldData): HTMLSmartListElement {
        const res: HTMLSmartListElement = super.addUnfilteredSmartListField(data);
        this.appendFieldContainerElementInTab(this.unfilteredSmartLists, data.id, data.tabId);
        return res;
    }

    public override addFilteredSmartListField(data: TabModalFilteredSmartListFieldData): HTMLSmartListElement {
        const res: HTMLSmartListElement = super.addFilteredSmartListField(data);
        this.appendFieldContainerElementInTab(this.filteredSmartLists, data.id, data.tabId);
        return res;
    }

    public override addRadioField(data: TabModalRadioFieldData): void {
        const res: void = super.addRadioField(data);
        this.appendFieldContainerElementInTab(this.radios, data.id, data.tabId);
        return res;
    }

    public override addMultiRadioField(data: TabModalMultiRadioFieldData): void {
        const res: void = super.addMultiRadioField(data);
        this.appendFieldContainerElementInTab(this.multiRadios, data.id, data.tabId);
        return res;
    }

    public override addTextareaField(data: TabModalTextareaFieldData): HTMLTextAreaElement {
        const res: HTMLTextAreaElement = super.addTextareaField(data);
        this.appendFieldContainerElementInTab(this.textareas, data.id, data.tabId);
        return res;
    }

    public override addCheckboxField(data: TabModalCheckboxFieldData): HTMLInputElement {
        const res: HTMLInputElement = super.addCheckboxField(data);
        this.appendFieldContainerElementInTab(this.checkboxes, data.id, data.tabId);
        return res;
    }

    public override addDateField(data: TabModalDateFieldData): HTMLInputElement {
        const res: HTMLInputElement = super.addDateField(data);
        this.appendFieldContainerElementInTab(this.dates, data.id, data.tabId);
        return res;
    }

    public override addPictureField(data: TabModalPictureFieldData): void {
        const res: void = super.addPictureField(data);
        this.appendFieldContainerElementInTab(this.pictures, data.id, data.tabId);
        return res;
    }

    // PUBLIC-GETTERS
    public getCurrentTabId(): string {
        return this.currentTabId;
    }
};

abstract class TabModalTemplate<T> {
    public constructor(private readonly tab1: TabModalTab, private readonly tab2: TabModalTab, private readonly options?: TabModalOptions) {}

    public async create(): Promise<T | null> {
        return new Promise<T | null>((resolve: Resolve<T | null>) => {
            const modal: TabModal = this.createModal(resolve);
            this.createTab1Fields(modal, this.tab1.id);
            this.createTab2Fields(modal, this.tab2.id);
        });
    }

    private createModal(resolve: Resolve<T | null>): TabModal {
        const modal: TabModal = new TabModal(this.tab1, this.tab2, async (confirm: boolean) => await this.onClose(modal, resolve, confirm), this.options);
        return modal;
    }

    protected abstract createTab1Fields(modal: TabModal, id: string): void;

    protected abstract createTab2Fields(modal: TabModal, id: string): void;

    private async onClose(modal: TabModal, resolve: Resolve<T | null>, confirm: boolean): Promise<void> {
        const currentTabId: string = modal.getCurrentTabId();

        if (currentTabId === this.tab1.id) {
            await this.onTab1Close(modal, resolve, confirm);
        }
        else if (currentTabId === this.tab2.id) {
            await this.onTab2Close(modal, resolve, confirm);
        }
        else {
            throw new Error(`Could not close tab modal: Current tab with id = "${currentTabId}" is invalid.`);
        }
    }

    protected abstract onTab1Close(modal: TabModal, resolve: Resolve<T | null>, confirm: boolean): Promise<void>;

    protected abstract onTab2Close(modal: TabModal, resolve: Resolve<T | null>, confirm: boolean): Promise<void>;
};

abstract class ManageModalTemplate<T extends ValueBase | void, D, R> {
    // INIT
    public constructor(private readonly elementName: string) {}

    protected abstract initModalFields(modal: Modal, defaultValues: D | undefined, edit: boolean): void;

    // EVENTS
    protected abstract onCreate(values: R): Promise<T>;

    protected abstract onEdit(values: R, id: ID): Promise<T>;

    // OTHER
    private async createEdit(prefix: string, defaultValues: D | undefined = undefined, edit: boolean, callback: (returnValues: R) => Promise<T | null>): Promise<T | null> {
        const title: string = `${prefix} ${this.elementName.toLowerCase()}`;

        return new Promise<T | null>((resolve: Resolve<T | null>) => {
            const modal: Modal = new Modal(title, async (confirm: boolean) => await this.close(resolve, modal, confirm, prefix, callback), { confirmButtonText: prefix });
            this.initModalFields(modal, defaultValues, edit);
        });
    }

    protected abstract getReturnValues(modal: Modal, prefix: string): Promise<R>;

    private async close(resolve: Resolve<T | null>, modal: Modal, confirm: boolean, prefix: string, callback: (returnValues: R) => Promise<T | null>): Promise<void> {
        if (!confirm) {
            resolve(null);
            return;
        }

        const returnValues: R = await this.getReturnValues(modal, prefix);
        resolve(callback(returnValues));
    }

    // PUBLIC
    protected async create(defaultValues?: D): Promise<T | null> {
        return await this.createEdit("Create", defaultValues, false, async (returnValues: R) => {
            return await this.onCreate(returnValues);
        });
    }

    protected async edit(defaultValues: D, id: ID): Promise<T | null> {
        return await this.createEdit("Edit", defaultValues, true, async (returnValues: R) => {
            return await this.onEdit(returnValues, id);
        });
    }
}

// MODAL.HEKO
export class ManagePlaylistModal extends ManageModalTemplate<void, ManagePlaylistModalDefaultValues, ManagePlaylistModalReturntValues> {
    // INIT    
    public constructor(private readonly playlists: Playlist[]) {
        super("playlist");
    }

    protected override initModalFields(modal: Modal, defaultValues: ManagePlaylistModalDefaultValues | undefined = undefined, edit: boolean): void {
        modal.addInputField({
            id: "name",
            name: "name",
            label: "Name:",
            minLength: 2,
            maxLength: 30,
            defaultValue: defaultValues?.name,
            isConditionValid: (modal: Modal, name: string | null) => this.isNameValid(name),
            errorMessage: (modal: Modal, name: string | null) => this.getNameErrorMessage(name),
        }).focus();

        modal.addPictureField({
            id: "thumbnail",
            name: "Thumbnail",
            label: "Thumbnail:",
            defaultValue: defaultValues?.thumbnailFileName,
            aspectRatio: "1 / 1",
            mandatory: false,
        });
    }

    // EVENTS
    protected override async onCreate(values: ManagePlaylistModalReturntValues): Promise<void> {
        const createPlaylistReqRes: CreatePlaylistApiResult = await Api.Playlists.create(values.name, values.thumbnail);
        if (!createPlaylistReqRes.success) {
            throw new Error(createPlaylistReqRes.error);
        }
    }

    protected override async onEdit(values: ManagePlaylistModalReturntValues, id: ID): Promise<void> {
        const editPlaylistReqRes: EditPlaylistApiResult = await Api.Playlists.edit(id, values.name, values.thumbnail, values.thumbnailEditType);
        if (!editPlaylistReqRes.success) {
            throw new Error(editPlaylistReqRes.error);
        }
    }

    // OTHER
    protected override async getReturnValues(modal: Modal, prefix: string): Promise<ManagePlaylistModalReturntValues> {
        const name: string = modal.getInputFieldValue("name");
        const thumbnailFilePath: string | null = modal.getPictureFieldValue("thumbnail");

        const isThumbnailNull: boolean = (thumbnailFilePath === null);
        const isNewThumbnail: boolean = Functions.Heko.isNewThumbnail(thumbnailFilePath ?? "") && !isThumbnailNull;
        const thumbnailEditType: ThumbnailEditType = isNewThumbnail ? "update" : isThumbnailNull ? "remove" : "keep";

        let thumbnail: File | null = null;
        if (thumbnailFilePath !== null && thumbnailEditType === "update") {
            const readFileReqRes: ReadFileApiResult = await Api.Files.read(thumbnailFilePath);
            if (!readFileReqRes.success) {
                throw new Error(readFileReqRes.error);
            }

            const name: string = Functions.Files.getFullName(thumbnailFilePath);
            thumbnail = new File([new Uint8Array(readFileReqRes.data)], name, { type: Functions.Files.getMimeType(thumbnailFilePath) });
        }

        return {
            name: name,
            thumbnail: thumbnail,
            thumbnailEditType: thumbnailEditType,
        };
    }

    private isNameValid(name: string | null): boolean {
        if (name === null) {
            return false;
        }

        const playlistNames: string[] = this.playlists.map<string>((playlist: Playlist) => playlist.name.toLowerCase());
        return !playlistNames.includes(name.toLowerCase());
    }

    private getNameErrorMessage(name: string | null): string | null {
        if (name === null) {
            return null;
        }

        if (!this.isNameValid(name)) {
            return `A playlist is already named ${name}.`;
        }

        return null;
    }

    // PUBLIC
    public static async create(playlists: Playlist[]): Promise<void | null> {
        return await new ManagePlaylistModal(playlists).create();
    }

    public static async edit(playlists: Playlist[], playlist: Playlist): Promise<void | null> {
        const defaultValues: ManagePlaylistModalDefaultValues = {
            name: playlist.name,
            thumbnailFileName: (playlist.thumbnailFileName !== undefined && playlist.thumbnailFileName !== "") ? Functions.Heko.getThumbnailPath(playlist.thumbnailFileName) : undefined,
        };

        const filteredPlaylists: Playlist[] = playlists.filter((p: Playlist) => p.id !== playlist.id);
        return await new ManagePlaylistModal(filteredPlaylists).edit(defaultValues, playlist.id);
    }
}

export class LoginRegisterModal extends TabModalTemplate<boolean> {
    private currentLoginErrorMessage: string | null = null;
    private currentRegisterErrorMessage: string | null = null;

    public constructor() {
        const loginTab: TabModalTab = { id: "login", title: "Login" };
        const registerTab: TabModalTab = { id: "register", title: "Register" };

        super(loginTab, registerTab, {
            confirmButtonText: "Continue",
            mandatory: true,
        });
    }

    protected override createTab1Fields(modal: TabModal, id: string): void {
        modal.addInputField({
            tabId: id,
            id: "login-email",
            label: "Email:",
            type: "email",
        });

        modal.addInputField({
            tabId: id,
            id: "login-password",
            label: "Password:",
            type: "password",
            isConditionValid: async (modal: Modal, password: string | null) => await this.isLoginValid(modal, password),
            errorMessage: () => this.currentLoginErrorMessage,
        });
    }

    protected override createTab2Fields(modal: TabModal, id: string): void {
        modal.addInputField({
            tabId: id,
            id: "register-name",
            label: "Name:",
            minLength: 3,
            maxLength: 150,
        });

        modal.addInputField({
            tabId: id,
            id: "register-email",
            label: "Email:",
            type: "email",
            maxLength: 150,
        });

        modal.addInputField({
            tabId: id,
            id: "register-password",
            label: "Password:",
            type: "password",
            minLength: 8,
            maxLength: 150,
        });

        modal.addInputField({
            tabId: id,
            id: "register-confirm-password",
            label: "Confirm password:",
            type: "password",
            minLength: 8,
            maxLength: 150,
            isConditionValid: async (modal: Modal, confirmPassword: string | null) => await this.isRegisterValid(modal, confirmPassword),
            errorMessage: () => this.currentRegisterErrorMessage,
        });
    }

    protected override async onTab1Close(modal: TabModal, resolve: Resolve<boolean>, confirm: boolean): Promise<void> {
        return resolve(confirm);
    }   

    protected override async onTab2Close(modal: TabModal, resolve: Resolve<boolean>, confirm: boolean): Promise<void> {
        return resolve(confirm);
    }

    private async isLoginValid(modal: Modal, password: string | null): Promise<boolean> {
        const email: string = modal.getInputFieldValue("login-email");

        if (password === null) {
            return false;
        }

        const loginReqRes: LoginApiResult = await Api.User.login(email, password);
        if (!loginReqRes.success) {
            this.currentLoginErrorMessage = loginReqRes.clientError;
            return false;
        }

        this.currentLoginErrorMessage = null;
        return true;
    }

    private async isRegisterValid(modal: Modal, confirmPassword: string | null): Promise<boolean> {
        const name: string = modal.getInputFieldValue("register-name");
        const email: string = modal.getInputFieldValue("register-email");
        const password: string = modal.getInputFieldValue("register-password");

        if (confirmPassword === null) {
            return false;
        }

        const registerReqRes: RegisterApiResult = await Api.User.register(name, email, password, confirmPassword);
        if (!registerReqRes.success) {
            this.currentRegisterErrorMessage = registerReqRes.clientError;
            return false;
        }

        this.currentRegisterErrorMessage = null;
        return true;
    }

    public static async open(): Promise<boolean | null> {
        return await new LoginRegisterModal().create();
    }
};

export class CreateSongModal extends ModalTemplate<Song> {
    public constructor(private readonly artists: Artist[]) {
        super("Create a song from local file", {
            confirmButtonText: "Create",
        });
    }

    protected override createFields(modal: Modal): void {
        modal.addInputField({
            id: "name",
            name: "Name",
            label: "Name:",
            minLength: 2,
            maxLength: 150,
        });

        modal.addFilteredSmartListField({
            id: "artists",
            name: "Artists",
            label: "Artists:",
            data: this.artists,
            onInvalidAdd: async (query: string) => await CreateArtistModal.open(this.artists, query),
        });

        modal.addFileField({
            id: "file",
            name: "File",
            label: "File:",
            fileZoneText: "Drag a song",
            dialogTitle: "Select a song",
            fileTypeName: "Song",
            extensions: ["mp3"],
        });

        // fixed filtered smart list empty data
        // fixed filtered smart list add unfiltered value
    }

    protected override async onClose(modal: Modal, resolve: Resolve<Song | null>, confirm: boolean): Promise<void> {
        if (!confirm) {
            resolve(null);
            return;
        }
    }

    public static async open(artists: Artist[]): Promise<Song | null> {
        return await new CreateSongModal(artists).create();
    }
}

export class CreateArtistModal extends ModalTemplate<Artist> {
    public constructor(private readonly artists: Artist[], private readonly defaultname?: string) {
        super("Create artist", {
            confirmButtonText: "Create",
        });
    }

    protected override createFields(modal: Modal): void {
        modal.addInputField({
            id: "name",
            name: "Name",
            label: "Name:",
            defaultValue: this.defaultname,
            minLength: 2,
            maxLength: 150,
            isConditionValid: (modal: Modal, name: string | null) => this.isNameValid(name),
            errorMessage: (modal: Modal, name: string | null) => this.getNameErrorMessage(name),
        });
    }

    protected override async onClose(modal: Modal, resolve: Resolve<Artist | null>, confirm: boolean): Promise<void> {
        if (!confirm) {
            resolve(null);
            return;
        }

        const name: string = modal.getInputFieldValue("name");

        const createArtistReqRes: CreateArtistApiResult = await Api.Artist.create(name);
        if (!createArtistReqRes.success) {
            throw new Error(createArtistReqRes.error);
        }

        const artist: Artist = createArtistReqRes.artist;
        this.artists.push(artist);
        resolve(artist);
    }

    private isNameValid(name: string | null): boolean {
        if (name === null) {
            return false;
        }

        return !this.artists.find((artist: Artist) => artist.name.toLowerCase() === name.toLowerCase());
    }

    private getNameErrorMessage(name: string | null): string | null {
        if (name === null) {
            return null;
        }

        if (!this.isNameValid(name)) {
            return `Artist with this name already exists.`;
        }

        return null;
    }

    public static async open(artists: Artist[], defaultname?: string): Promise<Artist | null> {
        return await new CreateArtistModal(artists, defaultname).create();
    }
}
