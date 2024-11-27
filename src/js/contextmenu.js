class Contextmenu {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.hover = null;
    }

    open(e, hover, menu) {
        if (hover) {
            this.hover = hover;
            this.hover.classList.add("contextmenu-hover");
        }

        this.container = document.createElement("ul");
        this.container.classList.add("contextmenu");
        this.container.style.top = `${e.y}px`;
        this.container.style.left = `${e.x}px`;
        document.body.appendChild(this.container);
        
        setTimeout(() => {
            const rect = this.container.getBoundingClientRect();
            if (rect.x + rect.width > this.app.settings.window.w - 10) this.container.style.left = `${e.x - rect.width}px`;
            if (rect.y + rect.height > this.app.settings.window.h - 20) this.container.style.top = `${e.y - rect.height}px`;
        }, 0);

        menu.forEach((line, index) => {
            const li = document.createElement("li");
            li.textContent = line.name;
            this.container.appendChild(li);

            if (line.children.length > 0) {
                let canRemove = true;

                const arrow = document.createElement("p");
                arrow.textContent = ">";
                arrow.classList.add("arrow");
                li.appendChild(arrow);

                li.addEventListener("mouseenter", () => {
                    canRemove = false;
                    const ulc = document.createElement("ul");
                    li.appendChild(ulc);

                    setTimeout(() => {
                        const ulcRect = ulc.getBoundingClientRect();
                        if (ulcRect.y + ulcRect.height > this.app.settings.window.h - 20) ulc.style.top = `calc(100% - ${ulcRect.height}px)`;
                        if (ulcRect.x + ulcRect.width > this.app.settings.window.w - 10) ulc.style.left = `calc(0% - ${ulcRect.width}px)`;
                    }, 0);
    
                    line.children.forEach((child) => {
                        const lic = document.createElement("li");
                        lic.textContent = child.name;
                        ulc.appendChild(lic);
                        if (child.call) lic.addEventListener("click", () => child.call());
                    });

                    ulc.addEventListener("mouseenter", () => canRemove = false);
                    ulc.addEventListener("mouseleave", () => canRemove = true);
                });

                this.container.addEventListener("mousemove", (e2) => setTimeout(() => {
                    const ul = li.querySelector("ul");
                    if (!e2.target.closest(`ul > li:nth-of-type(${index + 1})`)) canRemove = true;
                    if (canRemove && ul) ul.remove();
                }, 0));
            } else if (line.shortcut != null) {
                const shortcut = document.createElement("p");
                shortcut.textContent = line.shortcut;
                shortcut.classList.add("shortcut");
                li.appendChild(shortcut);
            }
            if (line.call) li.addEventListener("click", () => line.call());
        });
    }

    close() {
        if (!this.container) return;
        this.container.remove();
        this.container = null;
        if (this.hover) {
            this.hover.classList.remove("contextmenu-hover");
            this.hover = null;
        }
    }
};
