import App from "./../app.js";
import SettingsManager from "./settings.js";
import * as Functions from "./../utils/utils.functions.js";
import * as Elements from "./../utils/utils.elements.js";

export default class ApparenceSettings {
    constructor(private app: App, private main: SettingsManager) {
        this.initEvents();
    }

    private initEvents(): void {
        Elements.settings.apparence.mainColorInput.addEventListener("input", () => Functions.setCssVariable("main-col-1", Elements.settings.apparence.mainColorInput.value));
        Elements.settings.apparence.gradientColor1Input.addEventListener("input", () => Functions.setCssVariable("gradient-col-1", Elements.settings.apparence.gradientColor1Input.value));
        Elements.settings.apparence.gradientColor2Input.addEventListener("input", () => Functions.setCssVariable("gradient-col-2", Elements.settings.apparence.gradientColor2Input.value));
    }

    public loggedIn(): void {
        const settings: Settings = this.main.get();

        SettingsManager.setInputValue(Elements.settings.apparence.mainColorInput, settings.apparence.mainColor);
        SettingsManager.setInputValue(Elements.settings.apparence.gradientColor1Input, settings.apparence.gradientColor1);
        SettingsManager.setInputValue(Elements.settings.apparence.gradientColor2Input, settings.apparence.gradientColor2);

        // set les elements en fonction des settings 
        // et ca va appeler automatiquement les fonctions qui modifient
    }

    
};
