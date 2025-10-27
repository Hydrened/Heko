const w: any = (window as any);

export async function throwError(message: string): Promise<void> {
    await w.main.throwError(message);
}

export const mainEvents = {
    onPreviousButton: async (callback: () => void): Promise<void> => await w.mainEvents.onPreviousButton(callback),
    onPlayButton: async (callback: () => void): Promise<void> => await w.mainEvents.onPlayButton(callback),
    onNextButton: async (callback: () => void): Promise<void> => await w.mainEvents.onNextButton(callback),
};

export const win = {
    minimize: async (): Promise<void> => await w.win.minimize(),
    maximize: async (): Promise<void> => await w.win.maximize(),
    close: async (): Promise<void> => await w.win.close(),
    setThumbarPlayButton: async (type: string): Promise<void> => await w.win.setThumbarPlayButton(type),
    setTitle: async (title: string): Promise<void> => await w.win.setTitle(title),
};

export const token = {
    save: async (filePath: string): Promise<void> => await w.mainFolder.saveToken(filePath),
    get: async (): Promise<string> => await w.mainFolder.getToken(),
    remove: async (): Promise<void> => await w.mainFolder.removeToken(),
};
