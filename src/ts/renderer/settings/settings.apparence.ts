import App from "./../app.js";
import SettingsManager from "./settings.js";
import * as Elements from "./../utils/utils.elements.js";

export default class ApparenceSettingsManager {
    private data: ApparenceSettings = {
        theme: 0,
        enableAnimations: true,
    };

    constructor(private app: App, private main: SettingsManager) {
        this.initEvents();
    }

    private initEvents(): void {
        for (let i = 0; i < 6; i++) {
            const liElement: HTMLElement = document.createElement("li");
            Elements.settings.apparence.themesContainer.appendChild(liElement);

            liElement.style.background = `var(--gradient-theme-${i})`;

            const radioButtonElement: HTMLInputElement = document.createElement("input");
            radioButtonElement.type = "radio";
            radioButtonElement.name = "template-radio-button";
            radioButtonElement.setAttribute("tabindex", String(-1));
            liElement.appendChild(radioButtonElement);

            liElement.addEventListener("click", () => this.setTheme(i));
        }

        Elements.settings.apparence.enableAnimations.addEventListener("change", () => {
            this.setEnableAnimations(Elements.settings.apparence.enableAnimations.checked);
        });
    }

    public loggedIn(settings: Settings): void {
        this.loadTheme(settings);
        this.loadEnableAnimations(settings);
    }

    private loadTheme(settings: Settings): void {
        this.setTheme(settings.apparence.theme);

        const error: string = "Can't set theme: Template radio button is null.";

        const liElement: HTMLInputElement | null = Elements.settings.apparence.themesContainer.querySelector(`li:nth-of-type(${settings.apparence.theme + 1})`);
        if (liElement == null) {
            return this.app.throwError(error);
        }

        const radioButtonElement: HTMLInputElement | null = liElement.querySelector("input");
        if (radioButtonElement == null) {
            return this.app.throwError(error);
        }

        radioButtonElement.checked = true;
    }

    private loadEnableAnimations(settings: Settings): void {
        this.setEnableAnimations(settings.apparence.enableAnimations);
        Elements.settings.apparence.enableAnimations.checked = settings.apparence.enableAnimations;
    }

    private setTheme(theme: number): void {
        this.data.theme = theme;
        document.documentElement.setAttribute("theme", String(theme));
    }

    private setEnableAnimations(animations: boolean): void {
        this.data.enableAnimations = animations;
        document.documentElement.setAttribute("no-animations", String(!animations));
    }

    public get(): ApparenceSettings {
        return this.data;
    }
};
