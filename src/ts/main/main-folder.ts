import { ipcMain } from "electron";
import * as path from "path";
import * as fs from "fs";

export interface WindowSettings {
    x: number;
    y: number;
    w: number;
    h: number;
    f: boolean;
};

export class MainFolder {
    public settings: WindowSettings | null = null;
    private name:  string = "Heko";

    constructor() {
        this.initEvents();

        const mainFolderPath: string = this.getMainPath();
        this.checkFolder(mainFolderPath);

        const dataFolderPath: string = path.join(mainFolderPath, "data");
        this.checkFolder(dataFolderPath);

        const defaultSettings: WindowSettings = {
            x: 0,
            y: 0,
            w: 1280,
            h: 720,
            f: false,
        };
        const settingsPath: string = path.join(dataFolderPath, "settings.json");
        this.settings = this.checkFile(settingsPath, defaultSettings) as WindowSettings;

        const tokenPath: string = path.join(dataFolderPath, "token");
        this.checkFile(tokenPath, { value: "" });
    }

    private initEvents(): void {
        const tokenPath: string = path.join(this.getMainPath(), "data", "token");

        ipcMain.handle("mainFolder-saveToken", (_event, token: string) => {
            fs.writeFileSync(tokenPath, JSON.stringify({ value: token } as any));
        });

        ipcMain.handle("mainFolder-getToken", (_event) => {
            try {
                return (JSON.parse(fs.readFileSync(tokenPath, "utf-8")) as any).value;
            }
            catch {
                return "";
            }
        });

        ipcMain.handle("mainFolder-removeToken", (_event) => {
            try {
                fs.unlinkSync(tokenPath);
            }
            catch {
                
            }
        });
    }

    private checkFolder(folderPath: string): void {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
    }

    private checkFile(filePath: string, data: object): object {
        const exists: boolean = fs.existsSync(filePath);
        let currentData: object = {};

        if (exists) {
            try {
                currentData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

            } catch {
                currentData = {};
            }

            if (!this.hasSamePropsDeep(currentData, data)) {
                fs.writeFileSync(filePath, JSON.stringify(data));
                currentData = data;
            }

        } else {
            fs.writeFileSync(filePath, JSON.stringify(data));
            currentData = data;
        }

        return currentData;
    }

    private hasSamePropsDeep<T extends object, U extends object>(obj: U, template: T): boolean {
        for (const key in template) {

            if (!Object.prototype.hasOwnProperty.call(obj, key)) {
                return false;
            }

            const xVal: any = (obj as any)[key];
            const yVal: any = (template as any)[key];

            if (typeof yVal === "object" && yVal !== null) {
                if (typeof xVal !== "object" || xVal === null || !this.hasSamePropsDeep(xVal, yVal)) {
                    return false;
                }
            }
        }

        return true;
    }

    public saveWindowSettings(windowSettings: WindowSettings): void {
        if (this.settings == null) {
            return;
        }

        this.settings = windowSettings;

        const settingsPath: string = path.join(this.getMainPath(), "data", "settings.json");
        fs.writeFileSync(settingsPath, JSON.stringify(this.settings));
    }
    
    private getMainPath(): string {
        const localAppData: string | undefined = process.env.LOCALAPPDATA;

        if (localAppData == undefined) {
            throw new Error("Can't get localdata path.");
        }

        return path.join(localAppData, this.name);
    }
};
