const win = (window as any);

export async function throwError(message: string): Promise<void> {
    await win.main.throwError(message);
}

export async function minimizeWindow(): Promise<void> {
    await win.win.minimize();
}

export async function maximizeWindow(): Promise<void> {
    await win.win.maximize();
}

export async function closeWindow(): Promise<void> {
    await win.win.close();
}

export async function getDirname(): Promise<string> {
    return await win.path.getDirname();
}

export async function getDocuments(): Promise<string> {
    return await win.path.getDocuments();
}

export async function join(...parts: string[]): Promise<string> {
    return await win.path.join(...parts);
}

export async function readFileSync(filePath: string): Promise<string> {
    return await win.fs.readFileSync(filePath);
}

export async function readdirSync(dirPath: string): Promise<string[]> {
    return await win.fs.readdirSync(dirPath);
}

export async function writeFileSync(filePath: string, data: string): Promise<void> {
    await win.fs.writeFileSync(filePath);
}

export async function existsSync(filePath: string): Promise<boolean> {
    return await win.fs.existsSync(filePath);
}

export async function mkdirSync(filePath: string): Promise<void> {
    await win.fs.mkdirSync(filePath);
}

export async function saveToken(filePath: string): Promise<void> {
    await win.mainFolder.saveToken(filePath);
}

export async function getToken(): Promise<string> {
    return await win.mainFolder.getToken();
}
