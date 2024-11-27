class Tooltip {
    constructor() {
        this.elements = [];
        this.tooltip = null;
        this.refresh();
    }

    refresh() {
        this.reset();

        this.elements = document.querySelectorAll("[tooltip]");
        for (let i = 0; i < this.elements.length; i++) {
            this.elements[i].addEventListener("mouseenter", this.enter);
            this.elements[i].addEventListener("mouseleave", this.leave);
        }
    }

    reset() {
        for (let i = 0; i < this.elements.length; i++) {
            this.elements[i].removeEventListener("mouseenter", this.enter);
            this.elements[i].removeEventListener("mouseleave", this.leave);
        }
    }

    enter(e) {
        const element = e.target;
        const rect = element.getBoundingClientRect();

        this.tooltip = document.createElement("div");
        this.tooltip.classList.add("tooltip");
        this.tooltip.style.top = `${rect.y}px`;
        this.tooltip.style.left = `${rect.x + rect.width / 2}px`;
        document.body.appendChild(this.tooltip);

        const tooltipValue = e.target.getAttribute("tooltip");
        switch (tooltipValue) {
            case "text": this.tooltip.textContent = e.target.textContent; break;
            case "value": this.tooltip.textContent = e.target.value; break;
            default: this.tooltip.textContent = tooltipValue; break;
        }
    }

    leave() {
        if (!this.tooltip) return;
        this.tooltip.remove();
        this.tooltip = null;
    }
};
