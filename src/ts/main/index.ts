import { app, BrowserWindow, ipcMain, dialog , nativeImage, globalShortcut } from "electron";
import { MainFolder, WindowSettings } from "./main-folder.js";
import { downloadYoutubeSong, getYoutubeSongSrc } from "./song.js";
import * as path from "path";

class Index {
    private window: BrowserWindow | null = null;
    private readonly mainFolder: MainFolder;
    private thumbarButtons: Electron.ThumbarButton[] = [];
    private readonly dev: boolean = false;

    constructor() {
        this.mainFolder = new MainFolder();

        try {
            this.createWindow();
            this.initWindowEvents();
            this.initGlobalShortcuts();
            this.initRendererEvents();

        } catch (err:  unknown) {
            const error: string = ((err instanceof Error) ? err.message : String(err));
            dialog.showErrorBox("Error", error);
            this.window?.destroy();
        }
    }

    private createWindow(): void {
        if (this.mainFolder.settings == null) {
            throw new Error("Can't open window: Window settings are null.");
        }

        const onOpenWindowSettings: WindowSettings = this.mainFolder.settings;

        this.window = new BrowserWindow({
            title: "Heko",

            x: onOpenWindowSettings.x,
            y: onOpenWindowSettings.y,

            width: onOpenWindowSettings.w,
            height: onOpenWindowSettings.h,

            minWidth: 950,
            minHeight: 720,

            frame: false,

            webPreferences: {
                preload: path.join(__dirname, "preload.js"),
                contextIsolation: true,
                nodeIntegration: false,
                devTools: this.dev,
            },
        });

        if (onOpenWindowSettings.f) {
            this.window.maximize();
        }
        
        this.window.loadFile(path.join(__dirname, "..", "..", "index.html"));
            
        this.window.webContents.on("did-finish-load", () => {
            this.window?.webContents.send("mainEvents-start", { dev: this.dev });
        });

        this.thumbarButtons = [
            {
                tooltip: "Previous",
                icon: nativeImage.createFromPath(path.join(app.getAppPath(), "src", "assets", "window-previous.png")),
                click: () => {
                    if (this.window == null) {
                        throw new Error("Can't call previous button event: Window is null.");
                    }

                    this.window.webContents.send("mainEvents-previousButton");
                },
            },
            {
                tooltip: "Play",
                icon: nativeImage.createFromPath(path.join(app.getAppPath(), "src", "assets", "window-play.png")),
                click: () => {
                    if (this.window == null) {
                        throw new Error("Can't call play button event: Window is null.");
                    }

                    this.window.webContents.send("mainEvents-playButton");
                },
            },
            {
                tooltip: "Next",
                icon: nativeImage.createFromPath(path.join(app.getAppPath(), "src", "assets", "window-next.png")),
                click: () => {
                    if (this.window == null) {
                        throw new Error("Can't call next button evnet: Window is null.");
                    }

                    this.window.webContents.send("mainEvents-nextButton");
                },
            },
        ];

        this.window.setThumbarButtons(this.thumbarButtons);
    }

    private initWindowEvents(): void {
        if (this.window == null) {
            throw new Error("Can't init window events: Window is null.");
        }

        this.window.on("close", async (e) => {
            if (this.window == null) {
                throw new Error("Can't save window position: Window is null.");
            }

            e.preventDefault();

            await new Promise<void>((resolve) => {
                ipcMain.once("mainEvents-onClose-done", () => resolve());
                this.window!.webContents.send("mainEvents-onClose");
            });

            const bounds: Electron.Rectangle = this.window.getBounds();
            const fullscreen: boolean = this.window.isMaximized();

            const onCloseWindowSettings: WindowSettings = {
                x: bounds.x,
                y: bounds.y,
                w: bounds.width,
                h: bounds.height,
                f: fullscreen,
            };

            this.mainFolder.saveWindowSettings(onCloseWindowSettings);

            this.window.destroy();
        });
    }

    private initGlobalShortcuts(): void {
        globalShortcut.register("MediaPreviousTrack", () => {
            this.window?.webContents.send("mainEvents-previousButton");
        });

        globalShortcut.register("MediaPlayPause", () => {
            this.window?.webContents.send("mainEvents-playButton");
        });

        globalShortcut.register("MediaNextTrack", () => {
            this.window?.webContents.send("mainEvents-nextButton");
        });

        globalShortcut.register("Control+Up", () => {
            this.window?.webContents.send("mainEvents-volumeUp");
        });

        globalShortcut.register("Control+Down", () => {
            this.window?.webContents.send("mainEvents-volumeDown");
        });
    }

    private initRendererEvents(): void {
        this.initRendererWindowEvents();
        this.initRendererYoutubeEvents();
        this.initRendererMainEvents();
    }

    private initRendererMainEvents(): void {
        ipcMain.handle("main-throwError", (_event, message: string) => { 
            dialog.showErrorBox("Error", message);
            this.window?.close();
        });
    }

    private initRendererYoutubeEvents(): void {
        ipcMain.handle("youtube-downloadSong", async (_event, videoID: string) => {
            if (this.window == null) {
                throw new Error("Can't download youtube song: Window is null.");
            }

            return await downloadYoutubeSong(this.window!, videoID);
        });

        ipcMain.handle("youtube-getSongSrc", async (_event, videoID: string) => {
            if (this.window == null) {
                throw new Error("Can't get youtube song src: Window is null.");
            }

            return await getYoutubeSongSrc(this.window!, videoID);
        });
    }

    private initRendererWindowEvents(): void {
        app.on("window-all-closed", () => {
            if (process.platform !== "darwin") {
                app.quit();
            }
        });
        
        ipcMain.handle("win-minimize", (e: Electron.IpcMainInvokeEvent) => {
            if (this.window == null) {
                throw new Error("Can't minimize window: Window is null.");
            }

            this.window.minimize();
        });
        ipcMain.handle("win-maximize", (e: Electron.IpcMainInvokeEvent) => {
            if (this.window == null) {
                throw new Error("Can't maximize window: Window is null.");
            }

            this.window.maximize();
        });
        ipcMain.handle("win-close", (e: Electron.IpcMainInvokeEvent) => {
            if (this.window == null) {
                throw new Error("Can't close window: Window is null.");
            }

            this.window.close();
        });

        ipcMain.handle("win-set-thumbar-play-button", (e: Electron.IpcMainInvokeEvent, type: string) => {
            if (this.window == null) {
                throw new Error("Can't set thumbar play button: Window is null.");
            }

            this.thumbarButtons[1].tooltip = type.slice(0, 1).toUpperCase() + type.slice(1);
            this.thumbarButtons[1].icon = nativeImage.createFromPath(path.join(app.getAppPath(), "src", "assets", `window-${type}.png`)),
            this.window.setThumbarButtons(this.thumbarButtons);
        });

        ipcMain.handle("win-set-title", (e: Electron.IpcMainInvokeEvent, title: string) => {
            if (this.window == null) {
                throw new Error("Can't set window title: Window is null.");
            }

            this.window.setTitle(title);
        });
    }
};  

app.whenReady().then(() => {
    new Index();
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});
