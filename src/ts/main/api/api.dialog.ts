import Functions from "./../utils/utils.functions.js";
import { dialog } from "electron";
import { AskForFileApiResult } from "./../utils/utils.types.js";

export async function askForFile(title: string, name?: string, extensions?: string[]): Promise<AskForFileApiResult> {
    const result: Electron.OpenDialogReturnValue = await dialog.showOpenDialog({
        title: title,
        properties: ["openFile"],
        filters: [
            {
                name: name ?? "",
                extensions: extensions ?? [],
            },
        ],
    });

    const path: string | null = (result.canceled) ? null : result.filePaths[0] ?? null;
    return Functions.Api.success<AskForFileApiResult>({ path: path });
}
