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

        menu.forEach((line, index) => {
            const li = document.createElement("li");
            li.textContent = line.name;
            this.container.appendChild(li);

            if (line.children.length > 0) {
                let canRemove = true;

                const p = document.createElement("p");
                p.textContent = ">";
                li.appendChild(p);

                li.addEventListener("mouseenter", () => {
                    canRemove = false;
                    const ulc = document.createElement("ul");
                    li.appendChild(ulc);
    
                    line.children.forEach((child) => {
                        const lic = document.createElement("li");
                        lic.textContent = child.name;
                        ulc.appendChild(lic);
                        if (child.call) lic.addEventListener("click", () => child.call());
                    });

                    ulc.addEventListener("mouseenter", () => canRemove = false);
                    ulc.addEventListener("mouseleave", () => canRemove = true);
                });

                this.container.addEventListener("mousemove", (e) => {
                    setTimeout(() => {
                        const ul = li.querySelector("ul");
                        if (!e.target.closest(`ul > li:nth-of-type(${index + 1})`)) canRemove = true;
                        if (canRemove && ul) ul.remove();
                    }, 0);
                });
            }
            if (line.call) li.addEventListener("click", () => line.call());
        });
        return this.container;
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
