const w: any = (window as any);

export async function throwError(message: string): Promise<void> {
    await w.main.throwError(message);
}

export async function getVersion(): Promise<string> {
    return await w.main.getVersion();
}

export const mainEvents = {
    onStart: async (callback: (data: any) => void): Promise<void> => await w.mainEvents.onStart(callback),
    onClose: (callback: () => Promise<void>): void => w.mainEvents.onClose(callback),
    onPreviousButton: async (callback: () => void): Promise<void> => await w.mainEvents.onPreviousButton(callback),
    onPlayButton: async (callback: () => void): Promise<void> => await w.mainEvents.onPlayButton(callback),
    onNextButton: async (callback: () => void): Promise<void> => await w.mainEvents.onNextButton(callback),
    onVolumeUp: async (callback: () => void): Promise<void> => await w.mainEvents.onVolumeUp(callback),
    onVolumeDown: async (callback: () => void): Promise<void> => await w.mainEvents.onVolumeDown(callback),
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

export const youtube = {
    downloadSong: async (videoID: string, onUpdate: (data: string) => void): Promise<any> => await w.youtube.downloadSong(videoID, onUpdate),
    getSongSrc: async (videoID: string): Promise<any> => await w.youtube.getSongSrc(videoID),
};
