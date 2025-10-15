const w = (window as any);

export async function throwError(message: string): Promise<void> {
    await w.main.throwError(message);
}

export const win: any = {
    minimize: async (): Promise<void> => await w.win.minimize(),
    maximize: async (): Promise<void> => await w.win.maximize(),
    close: async (): Promise<void> => await w.win.close(),
};

export const path: any = {
    getDirname: async (): Promise<string> => await w.path.getDirname(),
    getDocuments: async (): Promise<string> => await w.path.getDocuments(),
    join: async (...parts: string[]): Promise<string> => await w.path.join(...parts),
};

export const fs: any = {
    readFileSync: async (filePath: string): Promise<string> => await w.fs.readFileSync(filePath),
    readdirSync: async (dirPath: string): Promise<string> => await w.fs.readdirSync(dirPath),
    writeFileSync: async (filePath: string, data: string): Promise<string> => await w.fs.writeFileSync(filePath, data),
    existsSync: async (filePath: string): Promise<string> => await w.fs.existsSync(filePath),
    mkdirSync: async (filePath: string): Promise<string> => await w.fs.mkdirSync(filePath),
};

export const mainFolder: any = {
    token: {
        save: async (filePath: string): Promise<void> => await w.mainFolder.saveToken(filePath),
        get: async (): Promise<string> => await w.mainFolder.getToken(),
        remove: async (): Promise<void> => await w.mainFolder.removeToken(),
    },
};
