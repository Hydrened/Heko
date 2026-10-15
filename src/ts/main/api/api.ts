import WindowManager from "./../window.js";
import Functions from "./../utils/utils.functions.js";
import { ipcMain } from "electron";
import * as ApiDialog from "./api.dialog.js";
import * as ApiFiles from "./api.files.js";
import * as ApiTemp from "./api.temp.js";

import { 
    ApiResult, ApiResultError,
} from "./../utils/utils.types.js";

export default class Api {
    public constructor(private readonly window: WindowManager) {
        this.initEvents();
    }

    private initEvents(): void {
        ipcMain.handle("api-dialog-ask-for-file", async (_, title: string, name?: string, extensions?: string[]) => await Api.handle(ApiDialog.askForFile, title, name, extensions));

        ipcMain.handle("api-files-read", async (_, path: string) => await Api.handle(ApiFiles.read, path));

        ipcMain.handle("api-temp-clear", async (_) => await Api.handle(ApiTemp.clear));
        ipcMain.handle("api-temp-paste-clipbord-image", async (_) => await Api.handle(ApiTemp.pasteClipbordImage));
    }

    private static async handle<T extends ApiResult>(apiCall: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T | ApiResultError> {
        try {
            return await apiCall(...args);
        }
        catch (error: unknown) {
            const errorStr: string = (error instanceof Error ? error.message : String(error));
            return Functions.Api.error(errorStr);
        }
    }
};
