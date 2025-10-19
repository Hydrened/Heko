import App from "./../app.js";
import * as Elements from "./../utils/utils.elements.js";

export default class SongManager {
    constructor(private app: App) {
        this.initEvents();
    }

    private initEvents(): void {
        if (Elements.songs.settingsButton == null) {
            return this.app.throwError("Can't initiate song manager events: Song settings button element is null.");
        }

        Elements.songs.settingsButton.addEventListener("click", async () => await this.openSettingButtonContextMenu());
    }

    private async openSettingButtonContextMenu(): Promise<void> {
        if (Elements.songs.settingsButton == null) {
            return this.app.throwError("Can't open setting button context menu: Song settings button element is null.");
        }

        const rect: DOMRect = Elements.songs.settingsButton.getBoundingClientRect();
        await this.app.contextmenuManager.createSongSettingContextMenu({ x: rect.x + rect.width, y: rect.y });
    }
};
