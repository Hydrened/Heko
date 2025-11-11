import App from "./../app.js";
import AccountSettingsManager from "./settings.account.js";
import ApparenceSettingsManager from "./settings.apparence.js";
import PreferencesSettingsManager from "./settings.preferences.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Functions from "./../utils/utils.functions.js";
import * as Elements from "./../utils/utils.elements.js";
import { getAccountShortcuts, getAccountRows } from "../contextmenus/contextmenu.rows/account.js";

export default class SettingsManager {
    public readonly account: AccountSettingsManager;
    public readonly apparence: ApparenceSettingsManager;
    public readonly preferences: PreferencesSettingsManager;

    private data: Settings | null = null;
    private isOpened: boolean = false;

    constructor(private app: App) {
        this.account = new AccountSettingsManager(this.app, this);
        this.apparence = new ApparenceSettingsManager(this.app, this);
        this.preferences = new PreferencesSettingsManager(this.app, this);

        this.initEvents();
    }

    private initEvents(): void {
        document.addEventListener("keydown", (e: KeyboardEvent) => {
            const isAModalOpened: boolean = (this.app.modalManager.getCurrentModalContainer() != null);
            if (e.key == "Escape" && this.isOpened && !isAModalOpened) {
                this.close();
            }

            if (!this.isOpened) {
                Functions.testShortcuts(e, getAccountShortcuts(), getAccountRows, this.app);
            }
        });

        window.addEventListener("wheel", (e: WheelEvent) => {
            if (!this.isOpened) {
                return;
            }

            e.preventDefault();

            Elements.settings.sectionContainer.scrollTop += e.deltaY;
        }, { passive: false});
    }

    public async loggedIn(): Promise<void> {
        await this.load();
        this.account.loggedIn(this.data!);
        this.apparence.loggedIn(this.data!);
        this.preferences.loggedIn(this.data!);        
    }

    public async save(): Promise<void> {
        if (!this.app.account.isLoggedIn()) {
            return;
        }

        const settings: Settings = {
            song: {
                shuffle: this.app.listenerManager.getShuffleState(),
                loop: this.app.listenerManager.getLoopState(),
                speed: this.app.listenerManager.getSpeed(),
                volume: this.app.listenerManager.getVolume(),
            },
            apparence: this.apparence.get(),
            preferences: this.preferences.get(),
        };

        const saveUserSettingsReqRes: any = await Requests.user.saveSettings(this.app, settings);
        if (!saveUserSettingsReqRes.success) {
            return this.app.throwError(`Can't save settings: ${saveUserSettingsReqRes.error}`);
        }
    }

    private async load(): Promise<void> {
        const getUserSettingsReqRes: any = await Requests.user.getSettings(this.app);
        if (!getUserSettingsReqRes.success) {
            return this.app.throwError(`Can't get user settings: ${getUserSettingsReqRes.error}`);
        }

        this.data = {
            song: {
                shuffle: (getUserSettingsReqRes.settings.shuffle == 1),
                loop: (getUserSettingsReqRes.settings.loop == 1),
                speed: getUserSettingsReqRes.settings.speed,
                volume: getUserSettingsReqRes.settings.volume,
            },
            apparence: {
                theme: getUserSettingsReqRes.settings.theme,
                enableAnimations: (getUserSettingsReqRes.settings.enableAnimations == 1),
            },
            preferences: {
                hideSuccessModals: (getUserSettingsReqRes.settings.hideSuccessModals == 1),
                volumeEasing: getUserSettingsReqRes.settings.volumeEasing,
            },
        };
    }

    public open(): void {
        if (!this.app.account.isLoggedIn()) {
            return;
        }

        this.isOpened = true;
        Elements.settings.container.classList.remove("hidden");
    }

    private close(): void {
        this.isOpened = false;
        Elements.settings.container.classList.add("hidden");
    }

    public get(): Settings {
        return {
            song: {
                loop: (this.data?.song.loop ?? false),
                shuffle: (this.data?.song.shuffle ?? false),
                speed: (this.data?.song.speed ?? -1),
                volume: (this.data?.song.volume ?? -1),
            },
            apparence: this.apparence.get(),
            preferences: this.preferences.get(),
        };
    }

    public areOpened(): boolean {
        return this.isOpened;
    }
};
