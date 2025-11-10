import App from "./../app.js";
import AccountSettings from "./settings.account.js";
import ApparenceSettings from "./settings.apparence.js";
import PreferencesSettings from "./settings.preferences.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Elements from "./../utils/utils.elements.js";

export default class SettingsManager {
    public readonly account: AccountSettings;
    public readonly apparence: ApparenceSettings;
    public readonly preferences: PreferencesSettings;

    private data: Settings | null = null;
    private isOpened: boolean = false;

    constructor(private app: App) {
        this.account = new AccountSettings(this.app, this);
        this.apparence = new ApparenceSettings(this.app, this);
        this.preferences = new PreferencesSettings(this.app, this);

        this.initEvents();
    }

    private initEvents(): void {
        document.addEventListener("keydown", (e: KeyboardEvent) => {
            const isAModalOpened: boolean = (this.app.modalManager.getCurrentModalContainer() != null);

            if (e.key == "Escape" && this.isOpened && !isAModalOpened) {
                this.close();
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
        this.account.loggedIn();
        this.apparence.loggedIn();
        this.preferences.loggedIn();
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
                mainColor: getUserSettingsReqRes.settings.mainColor,
                gradientColor1: getUserSettingsReqRes.settings.gradientColor1,
                gradientColor2: getUserSettingsReqRes.settings.gradientColor2,
                rotateGradient: (getUserSettingsReqRes.settings.rotateGradient == 1),
                gradientRotationSpeed: getUserSettingsReqRes.settings.gradientRotationSpeed,
                gradientDefaultRotation: getUserSettingsReqRes.settings.gradientDefaultRotation,
            },
            preferences: {
                hideSuccessModal: (getUserSettingsReqRes.settings.hideSuccessModal == 1),
                volumeEasing: getUserSettingsReqRes.settings.volumeEasing,
            },
        };
    }

    public open(): void {
        if (!this.app.account.loggedIn()) {
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
            apparence: {
                mainColor: (this.data?.apparence.mainColor ?? ""),
                gradientColor1: (this.data?.apparence.gradientColor1 ?? ""),
                gradientColor2: (this.data?.apparence.gradientColor2 ?? ""),
                rotateGradient: (this.data?.apparence.rotateGradient ?? false),
                gradientRotationSpeed: (this.data?.apparence.gradientRotationSpeed ?? 0),
                gradientDefaultRotation: (this.data?.apparence.gradientDefaultRotation ?? 0),
            },
            preferences: {
                hideSuccessModal: (this.data?.preferences.hideSuccessModal ?? false),
                volumeEasing: (this.data?.preferences.volumeEasing ?? 0),
            },
        };
    }

    public static setInputValue(input: HTMLInputElement, value: string): void {
        input.value = value;
        input.dispatchEvent(new Event("input"));
    }
};
