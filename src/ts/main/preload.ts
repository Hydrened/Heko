import { contextBridge, ipcRenderer } from "electron";
import * as Types from "./utils/utils.types.js";

async function invoke(channel: string, ...args: any[]): Promise<any> {
    return await ipcRenderer.invoke(channel, ...args);
}

contextBridge.exposeInMainWorld("win", {
    minimize: async (): Promise<void> => {
        await invoke("win-minimize");
    },

    maximize: async (): Promise<void> => {
        await invoke("win-maximize");
    },

    close: async (): Promise<void> => {
        await invoke("win-close");
    },

    setTitle: async (title: string): Promise<void> => {
        await invoke("win-set-title", title);
    },

    onStart: async (callback: (args: Types.AppArgs) => void): Promise<void> => {
        ipcRenderer.on("win-on-start", (e: Electron.IpcRendererEvent, args: Types.AppArgs) => callback(args));
    },

    onClose: async (callback: () => Promise<void>): Promise<void> => {
        ipcRenderer.on("win-on-close", async () => {
            await callback();
            ipcRenderer.send("win-on-close-done");
        });
    },

    onClosed: async (callback: () => Promise<void>): Promise<void> => {
        ipcRenderer.on("win-on-closed", async () => {
            await callback();
            ipcRenderer.send("win-on-closed-done");
        });
    },
});

contextBridge.exposeInMainWorld("api", {
    dialog: {
        askForFile: async (title: string, name?: string, extensions?: string[]): Promise<Types.AskForFileApiResult> => {
            return await invoke("api-dialog-ask-for-file", title, name, extensions);
        },
    },

    files: {
        read: async (path: string): Promise<Types.ReadFileApiResult> => {
            return await invoke("api-files-read", path);
        },
    },

    temp: {
        clear: async (): Promise<Types.ClearTempApiResult> => {
            return await invoke("api-temp-clear");
        },

        pasteClipbordImage: async (): Promise<Types.PasteClipbordImageApiResult> => {
            return await invoke("api-temp-paste-clipbord-image");
        },
    },
});
