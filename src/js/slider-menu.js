class SliderMenu {
    constructor(x, y, defaultValue, parameters, changeEvent) {
        this.changeEvent = changeEvent;
        this.container = document.createElement("div");
        this.container.classList.add("slider-menu");
        this.container.style.top = `${y}px`;
        this.container.style.left = `${x}px`;
        document.body.appendChild(this.container);

        this.slider = document.createElement("input");
        this.slider.type = "range";
        this.slider.setAttribute("min", parameters.min);
        this.slider.setAttribute("max", parameters.max);
        this.slider.setAttribute("step", parameters.step);
        this.slider.value = defaultValue;
        this.container.appendChild(this.slider);

        const indicator = document.createElement("p");
        this.container.appendChild(indicator);
        this.slider.addEventListener("input", (e) => {
            indicator.textContent = "x" + parseFloat(e.target.value).toFixed(1);
        });

        this.slider.dispatchEvent(new Event("input"));
        this.slider.addEventListener("input", this.changeEvent);
    }

    close() {
        this.container.remove();
        this.slider.removeEventListener("input", this.changeEvent);
        delete this;
    }
};
