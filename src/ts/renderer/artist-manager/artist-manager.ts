import Elements from "../utils/utils.elements.js";
import Functions from "../utils/utils.functions.js";
import { App } from "../app.js";
import * as Create from "../utils/utils.create.js";

export default class ArtistManager {
    // INIT
    public constructor(private readonly app: App) {
        this.initEvents();
    }

    private initEvents(): void {
        Elements.aside.artists.settingsButton.addEventListener("click", () => Functions.Elements.antiSpam<void>(Elements.aside.artists.settingsButton, async () => {
            await this.onArtistSettingsToAppButtonClick();
        }));
    }

    private async onArtistSettingsToAppButtonClick(): Promise<void> {
        await Create.CreateArtistModal.open([{ id: 1, name: "temp" }]);
    }
};
