import { contextBridge, ipcRenderer } from "electron";

declare global {
    interface Window {
        main: {
            throwError: (message: string) => void;
        };
        win: {
            minimize: () => void;
            maximize: () => void;
            close: () => void;
        };
        path: {
            getDirname: () => string;
            getDocuments: () => string;
            join: (...parts: string[]) => string;
        };
        fs: {
            readFileSync: (filePath: string) => string;
            readdirSync: (dirPath: string) => string[];
            writeFileSync: (filePath: string, data: string) => void;
            existsSync: (filePath: string) => boolean;
            mkdirSync: (filePath: string) => void;
        };
        mainFolder: {
            saveToken: (token: string) => void;
            getToken: () => string;
        };
    }
}

contextBridge.exposeInMainWorld("main", {
    throwError: (message: string) => {
        ipcRenderer.invoke("main-throwError", message);
    },
});

contextBridge.exposeInMainWorld("path", {
    getDirname: () => {
        return ipcRenderer.invoke("path-getDirname");
    },

    getDocuments: () => {
        return ipcRenderer.invoke("path-getDocuments");
    },

    join: (...parts: string[]) => {
        return ipcRenderer.invoke("path-join", ...parts);
    },
});

contextBridge.exposeInMainWorld("fs", {
    readFileSync: (filePath: string) => {
        return ipcRenderer.invoke("fs-readFileSync", filePath);
    },

    readdirSync: (dirPath: string) => {
        return ipcRenderer.invoke("fs-readdirSync", dirPath);
    },

    writeFileSync: (filePath: string, data: string) => {
        ipcRenderer.invoke("fs-writeFileSync", filePath, data);
    },

    existsSync: (filePath: string) => {
        return ipcRenderer.invoke("fs-existsSync", filePath);
    },

    mkdirSync: (filePath: string) => {
        ipcRenderer.invoke("fs-mkdirSync", filePath);
    },
});

contextBridge.exposeInMainWorld("win", {
    minimize: () => {
        ipcRenderer.invoke("win-minimize");
    },

    maximize: () => {
        ipcRenderer.invoke("win-maximize");
    },

    close: () => {
        ipcRenderer.invoke("win-close");
    },
});

contextBridge.exposeInMainWorld("mainFolder", {
    saveToken: (token: string) => {
        ipcRenderer.invoke("mainFolder-saveToken", token);
    },

    getToken: () => {
        return ipcRenderer.invoke("mainFolder-getToken");
    },
});
