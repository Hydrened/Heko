import fs from "fs/promises";
import AppPaths from "./../utils/utils.app-paths.js";
import Functions from "./../utils/utils.functions.js";
import { clipboard } from "electron";
import { ClearTempApiResult, PasteClipbordImageApiResult } from "./../utils/utils.types.js";

export async function clear(): Promise<ClearTempApiResult> {
    await Functions.Files.removeInFolder(AppPaths.getTempFolder());
    return Functions.Api.success<ClearTempApiResult>({});
}

export async function pasteClipbordImage(): Promise<PasteClipbordImageApiResult> {
    const image: Electron.NativeImage = clipboard.readImage();

    if (image.isEmpty()) {
        throw new Error(`Could not paste clipboard image: Clipboard has no images.`);
    }

    const file: Buffer = image.toPNG();
    const fileName: string = Functions.Files.createRandomName("placeholder.png");
    const filePath: string = `${AppPaths.getTempFolder()}/${fileName}`;

    await fs.writeFile(filePath, file);

    return Functions.Api.success<PasteClipbordImageApiResult>({ filePath: filePath });
}
