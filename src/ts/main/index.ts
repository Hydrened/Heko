import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import * as fs from "fs";
import { MainFolder, WindowSettings } from "./main-folder.js";

class Index {
    window: BrowserWindow | null = null;
    mainFolder: MainFolder;

    constructor() {
        this.mainFolder = new MainFolder();
        this.initEvents();
        this.createWindow();
    }

    private initEvents(): void {
        this.initWindowEvents();
        this.initMainEvents();
        this.initPathEvents();
        this.initFsEvents();
    }

    private initWindowEvents(): void {
        app.on("window-all-closed", () => {
            if (process.platform !== "darwin") {
                app.quit();
            }
        });
        
        ipcMain.handle("win-minimize", (_event) => this.window?.minimize());
        ipcMain.handle("win-maximize", (_event) => this.window?.maximize());
        ipcMain.handle("win-close", (_event) => this.window?.close());
    }

    private initMainEvents(): void {
        ipcMain.handle("main-throwError", (_event, message: string) => { 
            dialog.showErrorBox("Error", message);
            this.window?.close();
        });
    }

    private initPathEvents(): void {
        ipcMain.handle("path-getDirname", (_event) => __dirname);
        ipcMain.handle("path-getDocuments", (_event) => app.getPath("documents"));
        ipcMain.handle("path-join", (_event, ...parts: string[]) => path.join(...parts));
    }

    private initFsEvents(): void {
        ipcMain.handle("fs-readFileSync", (_event, filePath: string) => {
            try {
                return fs.readFileSync(filePath, "utf-8");
            }
            catch {
                return "";
            }
        });

        ipcMain.handle("fs-readdirSync", (_event, dirPath: string) => {
            try {
                return fs.readdirSync(dirPath);
            } catch {
                return [];
            }
        });

        ipcMain.handle("fs-writeFileSync", (_event, filePath: string, data: string) => {
            fs.writeFileSync(filePath, data);
        });

        ipcMain.handle("fs-existsSync", (_event, filePath: string) => {
            return fs.existsSync(filePath);
        });

        ipcMain.handle("fs-mkdirSync", (_event, filePath: string) => {
            fs.mkdirSync(filePath);
        });
    }

    private createWindow(): void {
        if (!this.mainFolder.settings) {
            return;
        }

        const onOpenWindowSettings: WindowSettings = this.mainFolder.settings?.window;

        this.window = new BrowserWindow({
            x: onOpenWindowSettings.x,
            y: onOpenWindowSettings.y,

            width: onOpenWindowSettings.w,
            height: onOpenWindowSettings.h,

            minWidth: 1280,
            minHeight: 720,

            frame: false,

            webPreferences: {
                preload: path.join(__dirname, "preload.js"),
                contextIsolation: true,
                nodeIntegration: false
            }
        });

        if (onOpenWindowSettings.f) {
            this.window.maximize();
        }
        
        this.window.loadFile(path.join(__dirname, "..", "..", "index.html"));

        this.window.on("close", (e) => {
            if (!this.window) {
                return;
            }

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
        });
    }
};

app.whenReady().then(() => {
    new Index();
});
