import path from "path";
import { app, BrowserWindow, ipcMain } from "electron";
import { AppArgs, Resolve } from "./utils/utils.types.js";

export default class WindowManager {
    private _window: BrowserWindow | null = null;

    public constructor(private readonly args: AppArgs) {
        this.create();
        this.initEvents();
    }

    private create(): void {
        this._window = new BrowserWindow({
            width: 1280,
            height: 720,

            minWidth: 950,
            minHeight: 720,

            frame: false,

            webPreferences: {
                preload: path.join(__dirname, "preload.js"),
                partition: "persist:heko",
                contextIsolation: true,
                nodeIntegration: false,
                devTools: true,
            },
        });

        this.window.maximize();

        this.window.loadFile(path.join(__dirname, "..", "..", "index.html"));
            
        this.window.webContents.on("did-finish-load", () => {
            this.window.webContents.send("win-on-start", this.args);
        });
    }

    public close(): void {
        this.window.close();
    }

    private initEvents(): void {
        this.window.on("close", (e: any) => this.onClose(e));
        app.on("window-all-closed", () => this.onAllClosed());
        
        ipcMain.handle("win-minimize", (e: Electron.IpcMainInvokeEvent) => this.window.minimize());
        ipcMain.handle("win-maximize", (e: Electron.IpcMainInvokeEvent) => this.window.maximize());
        ipcMain.handle("win-close", (e: Electron.IpcMainInvokeEvent) => this.window.close());
        ipcMain.handle("win-set-title", (e: Electron.IpcMainInvokeEvent, title: string) => this.window.setTitle(title));
    }

    private async onClose(e: any): Promise<void> {
        e.preventDefault();

        await new Promise<void>((resolve: Resolve<void>) => {
            this.window.webContents.send("win-on-close", this.args);
            ipcMain.once("win-on-close-done", () => resolve());
        });

        this.window.hide();
        await this.onClosed();
    }

    private async onClosed(): Promise<void> {
        await new Promise<void>((resolve: Resolve<void>) => {
            this.window.webContents.send("win-on-closed");
            ipcMain.once("win-on-closed-done", () => resolve());
        });

        this.window.destroy();
        this._window = null;
    }

    private onAllClosed(): void {
        if (process.platform !== "darwin") {
            app.quit();
        }
    }

    private get window(): BrowserWindow {
        if (this._window === null) {
            throw new Error("Could not get window: Window is null.");
        }

        return this._window;
    } 

    public send(channel: string, ...args: any[]): void {
        this.window.webContents.send(channel, ...args);
    }
};
