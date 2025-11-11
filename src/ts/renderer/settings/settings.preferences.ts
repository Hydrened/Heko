import App from "./../app.js";
import SettingsManager from "./settings.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PreferencesSettingsManager {
    private data: PreferencesSettings = {
        hideSuccessModals: false,
        volumeEasing: 0,
    };

    constructor(private app: App, private main: SettingsManager) {
        this.initEvents();
    }

    private initEvents(): void {
        Elements.settings.preferences.hideSuccessModalCheckbox.addEventListener("change", () => {
            this.setHideSuccessModals(Elements.settings.preferences.hideSuccessModalCheckbox.checked);
        });

        const radioButtonElements: HTMLInputElement[] = [...Elements.settings.preferences.volumeEasingContainer.querySelectorAll<HTMLInputElement>("input")];
        radioButtonElements.forEach((radioButtonElement: HTMLInputElement, index) => {
            radioButtonElement.addEventListener("change", () => this.setVolumeEasing(index));
        });
    }

    public loggedIn(settings: Settings): void {
        this.loadHideSuccessModals(settings);
        this.loadVolumeEasing(settings);
    }

    private loadHideSuccessModals(settings: Settings): void {
        this.setHideSuccessModals(settings.preferences.hideSuccessModals);
        Elements.settings.preferences.hideSuccessModalCheckbox.checked = settings.preferences.hideSuccessModals;
    }        

    private loadVolumeEasing(settings: Settings): void {
        this.setVolumeEasing(settings.preferences.volumeEasing);

        const radioButtonElement: HTMLInputElement | undefined = Elements.settings.preferences.volumeEasingContainer.querySelectorAll<HTMLInputElement>("input")[settings.preferences.volumeEasing];
        if (radioButtonElement == undefined) {
            return this.app.throwError("Can't load volume easing: Radio button element is undefined.");
        }

        radioButtonElement.checked = true;
    }

    private setHideSuccessModals(hide: boolean): void {
        this.data.hideSuccessModals = hide;
    }

    private setVolumeEasing(easing: number): void {
        this.data.volumeEasing = easing;
        this.app.listenerManager.setVolume(this.app.listenerManager.getVolume());
    }

    public get(): PreferencesSettings {
        return this.data;
    }
};
