import Elements from "./../utils/utils.elements.js";
import Functions from "./../utils/utils.functions.js";
import { App } from "./../app.js";
import * as Create from "./../utils/utils.create.js";

export default class SongManager {
    // INIT
    public constructor(private readonly app: App) {
        this.initEvents();
    }

    private initEvents(): void {
        Elements.aside.songs.settingsButton.addEventListener("click", () => Functions.Elements.antiSpam<void>(Elements.aside.songs.settingsButton, async () => {
            await this.onSongSettingsToAppButtonClick();
        }));
    }

    private async onSongSettingsToAppButtonClick(): Promise<void> {
        await Create.CreateSongModal.open([{ id: 1, name: "temp" }]);
    }
};
