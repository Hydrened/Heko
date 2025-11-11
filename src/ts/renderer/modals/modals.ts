import App from "./../app.js";
import CenterModal from "./modal.center.js";
import CenterSearchModal from "./modal.center.search.js";
import LoadingModal from "./modal.loading.js";
import TopModal from "./modal.top.js";

export default class ModalManager {
    private centerModals: CenterModal[] = [];
    private centerSearchModals: CenterSearchModal[] = [];
    private loadingModals: LoadingModal[] = [];
    private topModals: TopModal[] = [];

    // INIT
    constructor(private app: App) {

    }

    // OPEN
    public openCenterModal(data: CenterModalData): void {
        const modal: CenterModal = new CenterModal(this.app, data);
        this.centerModals.push(modal);
    }

    public openCenterSearchModal(data: CenterSearchModalData): void {
        const modal: CenterSearchModal = new CenterSearchModal(this.app, data);
        this.centerSearchModals.push(modal);
    }

    public async openLoadingModal(title: string, promise: Promise<any>): Promise<any> {
        const modal: LoadingModal = new LoadingModal(this.app, title);
        this.loadingModals.push(modal);

        const res: any = await promise;
        this.loadingModals.splice(this.loadingModals.indexOf(modal), 1);
        modal.close();

        return res;
    }

    public openTopModal(type: TopModalType, message: string): void {
        if (this.app.settings.preferences.get().hideSuccessModals) {
            return;
        }

        const modal: TopModal = new TopModal(this.app, type, message);
        this.topModals.push(modal);
    }

    // CLOSE
    private closeCurrentModal<T extends { close: () => void }>(modals: T[]): boolean {
        const modal: T | null = (modals[modals.length - 1] ?? null);
        if (modal == null) {
            return false;
        }

        modal.close();
        modals.pop();
        return true;
    }

    public closeCurrentCenterModal(data: CenterModalData): boolean {
        return this.closeCurrentModal<CenterModal>(this.centerModals);
    }

    public closeCurrentCenterSearchModal(data: CenterSearchModalData): boolean {
        return this.closeCurrentModal<CenterSearchModal>(this.centerSearchModals);
    }

    public closeCurrentLoadingModal(title: string, promise: Promise<any>): boolean {
        return this.closeCurrentModal<LoadingModal>(this.loadingModals);
    }

    public closeCurrentTopModal(type: TopModalType, message: string): boolean {
        return this.closeCurrentModal<TopModal>(this.topModals);
    }

    // GETTERS
    public getCurrentModalContainer(): HTMLElement | null {
        const modals: Element[] = [...document.querySelectorAll(".modal:not(.closing)")];
        return ((modals[modals.length - 1] as HTMLElement) ?? null);
    }

    public getCurrentCenterModal(): CenterModal | null {
        return (this.centerModals[this.centerModals.length - 1] ?? null);
    }

    public getCurrentCenterSearchModal(): CenterSearchModal | null {
        return (this.centerSearchModals[this.centerSearchModals.length - 1] ?? null);
    }

    public getCurrentLoadingModal(): LoadingModal | null {
        return (this.loadingModals[this.loadingModals.length - 1] ?? null);
    }

    public getCurrentTopModal(): TopModal | null {
        return (this.topModals[this.topModals.length - 1] ?? null);
    }
};
