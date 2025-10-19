export default class InputSelect {
    private list: HTMLElement | null = null;
    private selected: number = -1;

    constructor(private input: HTMLInputElement, private data: string[]) {
        this.initEvents();
        this.initContainer();
    }

    private initEvents(): void {
        this.input.addEventListener("focus", () => this.onFocus());
        this.input.addEventListener("blur", (e: FocusEvent) => this.onBlur());
        this.input.addEventListener("input", (e: Event) => this.filter());

        this.input.addEventListener("keydown", (e: KeyboardEvent) => {
            switch (e.key) {
                case "Escape":
                    setTimeout(() => this.input.blur(), 0);
                    break;
            
                case "ArrowUp":
                    this.incrSelected(-1);
                    break;

                case "ArrowDown":
                    this.incrSelected(1);
                    break;

                case "Enter":
                    this.confirmChoice();
                    break

                default: break;
            }
        });
    }

    private initContainer(): void {
        this.input.classList.add("input-select");
        this.input.type = "text";
        
        const inputParent: HTMLElement | null = this.input.parentElement;
        if (inputParent == null) {
            return;
        }

        const container: HTMLElement = document.createElement("input-select");
        inputParent.appendChild(container);
        container.appendChild(this.input);

        this.list = document.createElement("ul");
        container.appendChild(this.list);

        this.data.forEach((entry: string, index: number) => {
            if (this.list == null) {
                return;
            }

            const li: HTMLElement = document.createElement("li");
            li.textContent = entry;
            li.setAttribute("id", `${index}`);
            li.classList.add("input-select-li");
            li.classList.add("hidden");
            this.list.appendChild(li);

            li.addEventListener("mousedown", (e: MouseEvent) => {
                this.input.value = entry;
                this.filter();
                this.onBlur();
            });
        });
    }

    private filter(): void {
        if (this.list == null) {
            return;
        }

        this.selected = -1;

        const text: string = this.input.value.toLowerCase();

        this.data.forEach((entry: string, index: number) => {
            if (this.list == null) {
                return;
            }

            const li: Element = this.list.children[index];
            li.classList.remove("selected");

            (entry.toLowerCase().includes(text)) ? li.classList.remove("hidden") : li.classList.add("hidden");
        });
    }

    private onFocus(): void {
        this.filter();
    }

    private onBlur(): void {
        if (this.list == null) {
            return;
        }

        [...this.list.children].forEach((li: Element) => {
            li.classList.add("hidden");
            li.classList.remove("selected");
        });

        this.selected = -1;
    }

    private incrSelected(incr: number): void {
        if (this.list == null) {
            return;
        }

        const visibleLis: Element[] = [...this.list.querySelectorAll("li:not(.hidden)")];
        const nbVisibleLi: number = visibleLis.length;

        if (this.selected == -1) {
            this.selected = 0;
        } else {
            this.selected += incr;
        }

        while (this.selected < 0) {
            this.selected += nbVisibleLi;
        }

        while (this.selected > nbVisibleLi - 1) {
            this.selected -= nbVisibleLi;
        }

        const li: Element | null = visibleLis[this.selected];
        if (li == null) {
            return;
        }

        [...this.list.children].forEach((li: Element) => {
            li.classList.remove("selected");
        });

        li.classList.add("selected");
    }

    private confirmChoice(): void {
        if (this.selected == -1) {
            return;
        }

        if (this.list == null) {
            return;
        }

        const selectedLi: Element | null = this.list.querySelector("li.selected");
        if (selectedLi == null) {
            return;
        }

        this.input.value = selectedLi.textContent;
        setTimeout(() => this.input.blur(), 0);
    }
};
