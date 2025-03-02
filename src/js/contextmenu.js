class Contextmenu {
    // INIT
    constructor(app) {
        this.app = app;

        this.initVariables();
        this.initEvents();
    }

    initVariables() {
        this.container = null;
        this.hoverElement = null;
    }

    initEvents() {
        document.addEventListener("click", () => {
            if (this.isOpened()) this.close();
        });
    }

    // EVENTS
    open(e, hoverElement, menus) {
        this.close();

        if (menus == null) return;
        if (!Array.isArray(menus)) return;
        if (menus.length == 0) return;

        if (hoverElement != null) {
            this.hoverElement = hoverElement;
            this.hoverElement.classList.add("contextmenu-hover");
        }

        this.container = document.createElement("ul");
        this.container.classList.add("contextmenu");
        this.container.style.top = `${e.y}px`;
        this.container.style.left = `${e.x}px`;
        document.body.appendChild(this.container);

        menus.forEach((line, index) => {
            const li = document.createElement("li");
            li.textContent = line.name;
            this.container.appendChild(li);

            if (line.children.length > 0) {

            } else if (line.shortcut != null) {
                const shortcut = document.createElement("p");
                shortcut.textContent = line.shortcut;
                shortcut.classList.add("shortcut");
                li.appendChild(shortcut);
            }

            if (line.call != null) li.addEventListener("click", () => line.call());
        });
    }

    close() {
        if (this.isOpened()) {
            this.container.remove();
            if (this.hoverElement) this.hoverElement.classList.remove("contextmenu-hover");
        }
        this.container = null;
        this.hoverElement = null;
    }

    // GETTER
    isOpened() {
        return this.container != null;
    }
};
