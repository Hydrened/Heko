import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("mainEvents", {
    onStart: (callback: (data: any) => void): void => {
        ipcRenderer.on("mainEvents-start", (e: Electron.IpcRendererEvent, data: any) => callback(data));
    },

    onClose: (callback: () => Promise<void>): void => {
        ipcRenderer.on("mainEvents-onClose", async () => {
            await callback();
            ipcRenderer.send("mainEvents-onClose-done");
        });
    },

    onPreviousButton: (callback: () => void): void => {
        ipcRenderer.on("mainEvents-previousButton", () => callback());
    },

    onPlayButton: (callback: () => void): void => {
        ipcRenderer.on("mainEvents-playButton", () => callback());
    },

    onNextButton: (callback: () => void): void => {
        ipcRenderer.on("mainEvents-nextButton", () => callback());
    },

    onVolumeUp: (callback: () => void): void => {
        ipcRenderer.on("mainEvents-volumeUp", () => callback());
    },

    onVolumeDown: (callback: () => void): void => {
        ipcRenderer.on("mainEvents-volumeDown", () => callback());
    },
});

contextBridge.exposeInMainWorld("main", {
    throwError: (message: string): void => {
        ipcRenderer.invoke("main-throwError", message);
    },
});

contextBridge.exposeInMainWorld("win", {
    minimize: (): void => {
        ipcRenderer.invoke("win-minimize");
    },

    maximize: (): void => {
        ipcRenderer.invoke("win-maximize");
    },

    close: (): void => {
        ipcRenderer.invoke("win-close");
    },

    setThumbarPlayButton: (type: string): void => {
        ipcRenderer.invoke("win-set-thumbar-play-button", type);
    },

    setTitle: (title: string): void => {
        ipcRenderer.invoke("win-set-title", title);
    },
});

contextBridge.exposeInMainWorld("mainFolder", {
    saveToken: (token: string) => {
        ipcRenderer.invoke("mainFolder-saveToken", token);
    },

    getToken: (): Promise<string> => {
        return ipcRenderer.invoke("mainFolder-getToken");
    },

    removeToken: (): void => {
        ipcRenderer.invoke("mainFolder-removeToken");
    },
});
