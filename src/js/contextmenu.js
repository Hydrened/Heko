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
        
        document.addEventListener("keydown", (e) => {
            switch (e.key.toLowerCase()) {
                case "escape": if (this.isOpened()) this.close(); break;
                default: break;
            }
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

        function buildMenu(container, rows) {
            rows.forEach((row, index) => {
                const li = document.createElement("li");
                li.textContent = row.name;
                container.appendChild(li);
    
                if (row.children.length > 0) {
                    const arrow = document.createElement("p");
                    arrow.textContent = ">";
                    arrow.classList.add("arrow");
                    li.appendChild(arrow);
    
                    li.addEventListener("mouseenter", () => {
                        const ulc = document.createElement("ul");
                        ulc.classList.add("submenu");
                        li.appendChild(ulc);
            
                        buildMenu(ulc, row.children);
            
                        li.addEventListener("mouseenter", () => ulc.style.display = "block");
                        li.addEventListener("mouseleave", () => ulc.style.display = "none");
                    });
    
                    li.addEventListener("mouseleave", () => {
                        const ul = li.querySelector("ul");
                        ul.remove();
                    });
    
                } else if (row.call == null) li.classList.add("disabled");
                
                if (row.shortcut != null) {
                    const shortcut = document.createElement("p");
                    shortcut.textContent = row.shortcut;
                    shortcut.classList.add("shortcut");
                    li.appendChild(shortcut);
                }
    
                if (row.call != null) li.addEventListener("click", () => row.call());
            });
        }

        buildMenu(this.container, menus);
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
