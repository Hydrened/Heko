import fs from "fs/promises";
import Functions from "../utils/utils.functions.js";
import { ReadFileApiResult } from "../utils/utils.types.js";

export async function read(path: string): Promise<ReadFileApiResult> {
    const data: Buffer = await fs.readFile(path);
    return Functions.Api.success<ReadFileApiResult>({ data: data });
}
