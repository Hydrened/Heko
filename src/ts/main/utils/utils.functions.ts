import { app } from "electron";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import Crypto from "crypto";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { ID, ValueBase, Position, Size, Rect, Resolve, Reject, MoveFile, FileError, ColorRGB, ExecuteCommandEvents, ApiResultError } from "./utils.types.js";

namespace Functions {
    const version: number = 1.12;

    export namespace Maths {
        export function clamp(value: number, min: number, max: number): number {
            return Math.max(min, Math.min(max, value));
        }

        export function lerp(value: number, min: number, max: number): number {
            return min + (max - min) * value;
        }

        export function normalize(value: number, min: number, max: number): number {
            return Math.max(0, Math.min(1, (value - min) / (max - min)));
        }

        export function randomIntInRange(min: number, max: number): number {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        export function randomValueFromArray<T>(values: T[]): T | null {
            return (values.length === 0) ? null :  values[randomIntInRange(0, values.length - 1)] ?? null;
        }

        export function createNumberArrayFromMinAndMax(min: number, max: number): number[] {
            const res: number[] = [];

            for (let i = min; i <= max; i++) {
                res.push(i);
            }

            return res;
        }
    };

    export namespace Geometry {
        export function getPosition<T extends { x: number, y: number }>(e: T): Position {
            return { x: e.x, y: e.y };
        }

        export function getRect(rect: DOMRect): Rect {
            return {
                x: rect.x,
                y: rect.y,
                w: rect.width,
                h: rect.height,
            };
        }

        export function getRectCenter(rect: Rect): Position {
            const centerX: number = rect.x + rect.w * 0.5;
            const centerY: number = rect.y + rect.h * 0.5;

            return { x: centerX, y: centerY };
        }

        export function getRectCenterX(rect: Rect): number {
            return getRectCenter(rect).x;
        }

        export function getRectCenterY(rect: Rect): number {
            return getRectCenter(rect).y;
        }

        export function getDistance(a: Position, b: Position): number {
            return Math.hypot(b.x - a.x, b.y - a.y);
        }

        export function isPointInRect(rect: Rect, point: Position): boolean {
            const minX: number = rect.x;
            const maxX: number = rect.x + rect.w;

            const minY: number = rect.y;
            const maxY: number = rect.y + rect.h;

            const isInX: boolean = (point.x >= minX && point.x <= maxX);
            const isInY: boolean = (point.y >= minY && point.y <= maxY);

            return isInX && isInY;
        }
    };

    export namespace Files {
        export function formatBytes(bytes: number): string {
            const units = ["B", "KB", "MB", "GB", "TB"];

            let size: number = bytes;
            let unit: number = 0;

            while (size >= 1024 && unit < units.length - 1) {
                size /= 1024;
                unit++;
            }

            return `${size.toFixed(2)} ${units[unit]}`;
        }

        export function createRandomName(fileName: string): string {
            const randomId: string = Crypto.randomUUID();
            const extention: string = path.extname(fileName);
            return randomId + extention;
        }

        export async function getImageSize(imageFileName: string): Promise<Size> {
            return new Promise<Size>((resolve: Resolve<Size>) => {
                const img: HTMLImageElement = new Image();

                img.onload = () => {
                    resolve({
                        w: img.naturalWidth,
                        h: img.naturalHeight
                    });
                };

                img.onerror = () => {
                    resolve({ w: 0, h: 0 });
                };

                img.src = imageFileName;
            });
        }

        export async function getVideoSize(videoFileName: string): Promise<Size> {
            return new Promise<Size>((resolve: Resolve<Size>) => {
                const video: HTMLVideoElement = document.createElement("video");

                video.onloadedmetadata = () => {
                    resolve({
                        w: video.videoWidth,
                        h: video.videoHeight
                    });
                };

                video.onerror = () => {
                    resolve({ w: 0, h: 0 });
                };

                video.src = videoFileName;
            });
        }

        export async function getMediaSize(fileName: string): Promise<Size> {
            return await (isMediaPicture(fileName) ? getImageSize(fileName) : getVideoSize(fileName));
        }

        export function getWeight(file: File): number {
            return file.size / (1024 * 1024);
        }

        export function getFileFromInput(inputElement: HTMLInputElement): File | null {
            return inputElement.files?.[0] ?? null;
        }

        export function isMediaPicture(fileName: string): boolean {
            const imageExtensions: Set<string> = new Set<string>([ ".png", ".jpg", ".jpeg", ".jpe", ".jfif", ".gif", ".webp", ".bmp", ".svg", ".ico" ]);
            const extension: string = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
            return imageExtensions.has(extension);
        }

        export function isMediaVideo(fileName: string): boolean {
            const videoExtensions: Set<string> = new Set<string>([ ".mp4", ".webm", ".mov", ".avi", ".mkv", ".wmv", ".m4v" ]);
            const extension: string = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
            return videoExtensions.has(extension);
        }

        export function isMediaGif(fileName: string): boolean {
            const extension: string = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
            return extension === ".gif";
        }

        export function getName(filePath: string): string {
            return path.parse(filePath).name;
        }

        export function getFullName(filePath: string): string {
            return `${getName(filePath)}${getExtension(filePath)}`;
        }

        export function getExtension(filePath: string, withPoint: boolean = true): string {
            const res: string = path.parse(filePath).ext.toLowerCase();
            return withPoint ? res : res.slice(1);
        }

        export function getDirectory(filePath: string): string {
            return path.parse(filePath).dir;
        }

        export async function read<T>(path: string): Promise<T> {
            try {
                const data: string = await fsp.readFile(path, "utf8");
                if (data.trim().length === 0) {
                    return {} as T;
                }

                return JSON.parse(data) as T;
            }
            catch (err: unknown) {
                const error: string = (err as Error).message;
                throw new Error(`Could not read in file "${path}": ${error}.`);
            }
        }

        export async function write(path: string, data: string): Promise<void> {
            try {
                await fsp.writeFile(path, data, "utf8");
            }
            catch (err: unknown) {
                const error: string = (err as Error).message;
                throw new Error(`Could not write in file "${path}": ${error}.`);
            }
        }

        export async function copyPaste(file: MoveFile): Promise<void> {
            try {
                await fsp.copyFile(file.sourcePath, file.destinationPath);
            }
            catch (err: unknown) {
                const error: string = (err as Error).message;
                throw new Error(`Could not copy file "${file.sourcePath}" to "${file.destinationPath}": ${error}.`);
            }
        }

        export async function copyPasteMultiple(files: MoveFile[]): Promise<FileError[]> {
            const res: FileError[] = [];

            for (const file of files) {
                try {
                    await fsp.copyFile(file.sourcePath, file.destinationPath);
                }
                catch (err: unknown) {
                    res.push({ ...file, message: (err as Error).message });
                }
            }

            return res;
        }

        export async function cutPasteMultiple(files: MoveFile[], onProgress?: (value: number) => void): Promise<FileError[]> {
            const res: FileError[] = [];
            let count = 0;

            for (const file of files) {
                try {
                    try {
                        await fsp.rename(file.sourcePath, file.destinationPath);
                    }
                    catch (err: unknown) {
                        if ((err as NodeJS.ErrnoException).code !== "EXDEV") {
                            throw err;
                        }

                        await fsp.copyFile(file.sourcePath, file.destinationPath);
                        await fsp.unlink(file.sourcePath);
                    }

                    count++;

                    if (onProgress !== undefined) {
                        onProgress(count / files.length);
                    }
                }
                catch (err: unknown) {
                    res.push({ ...file, message: (err as Error).message });
                }
            }

            return res;
        }

        export async function remove(path: string): Promise<void> {
            try {
                await fsp.unlink(path);
            }
            catch (err: unknown) {
                const error: string = (err as Error).message;
                throw new Error(`Could not remove file "${path}": ${(err as Error).message}.`);
            }
        }

        export async function removeInFolder(path: string): Promise<void> {
            try {
                const entries = await fsp.readdir(path, { withFileTypes: true });
                await Promise.all(entries.filter((entry: any) => entry.isFile()).map((entry: any) => fsp.unlink(`${path}/${entry.name}`)));
            }
            catch (err: unknown) {
                throw new Error(`Could not remove files from folder "${path}": ${(err as Error).message}.`);
            }
        }

        export async function backup(fileName: string, maxCount: number = 5): Promise<void> {
            const date: Date = new Date();

            const yyyy: number = date.getFullYear();
            const mm: string = String(date.getMonth() + 1).padStart(2, "0");
            const dd: string = String(date.getDate()).padStart(2, "0");

            const hh: string = String(date.getHours()).padStart(2, "0");
            const min: string = String(date.getMinutes()).padStart(2, "0");
            const ss: string = String(date.getSeconds()).padStart(2, "0");

            const formatted = `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;

            const name: string = path.parse(fileName).name;
            const ext: string = path.parse(fileName).ext;

            const mediaFileSourcePath: string = `./data/${name}${ext}`;
            const mediaFileDestinationPath: string = `./data/backups/${name}-${formatted}${ext}`;

            await copyPaste({ sourcePath: mediaFileSourcePath, destinationPath: mediaFileDestinationPath });

            const backupFiles: string[] = (await fsp.readdir("./data/backups")).filter((path: string) => path.startsWith(name)).sort((a: string, b: string) => a.localeCompare(b));
            if (backupFiles.length <= maxCount) {
                return;
            }

            const backupFilesToRemove: string[] = backupFiles.slice(0, -5);
            for (let i = 0; i < backupFilesToRemove.length; i++) {
                const backupFileToRemove: string = `./data/backups/${backupFilesToRemove[i]}`;
                await remove(backupFileToRemove);
            }
        }
    };

    export namespace Strings {
        export function decodeNumericEntities(str: string): string {
            str = str.replace(/&#(\d+);/g, (_, dec) => {
                return String.fromCharCode(Number(dec));
            });

            str = str.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
                return String.fromCharCode(parseInt(hex, 16));
            });

            str = str.replace(/&apos;/g, "'");
            str = str.replace(/&quot;/g, '"');
            str = str.replace(/&amp;/g, '&');
            str = str.replace(/&lt;/g, '<');
            str = str.replace(/&gt;/g, '>');

            return str;
        }

        export function pluralize(singularWord: string, pluralizedWord: string, n: number): string {
            return ((n === 1) ? singularWord : pluralizedWord);
        }

        export function capitalize(word: string): string {
            return (word.length === 0) ? "" : `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
        }

        export function smartIncludes(base: string, query: string, caseSensitive: boolean = false): boolean {
            const queries: string[] = (caseSensitive ? query : query.toLowerCase()).split(" ");
            const filter: string[] = (caseSensitive ? base : base.toLowerCase()).split(" ");

            return queries.every((value: string) => filter.some((filterWord: string) => filterWord.includes(value)));
        }

        export function formatLabel(str: string): string {
            return str.replace(/-/g, " ").replace(/^./, (c: string) => c.toUpperCase());
        }
    };

    export namespace Paths {
        export function toBackslashes(path: string): string {
            return path.replace(/\//g, "\\");
        }

        export function toSlashes(path: string): string {
            return path.replace(/[\\/]/g, "/");
        }

        export async function isFile(path: string): Promise<boolean> {
            if (!fs.existsSync(path)) {
                return false;
            }

            return (await fsp.stat(path)).isFile();
        }

        export async function isDirectory(path: string): Promise<boolean> {
            if (!fs.existsSync(path)) {
                return false;
            }

            return (await fsp.stat(path)).isDirectory();
        }

        export function getRessourcePath(): string {
            return ((app.isPackaged) ? process.resourcesPath : process.cwd());
        }
    };

    export namespace Time {
        export async function sleep(duration: number): Promise<void> {
            await new Promise<void>((resolve: Resolve<void>) => setTimeout(() => resolve(), duration));
        }

        export function secondsToDurationFormat(seconds: number): string {
            const hrs: number = Math.floor(seconds / 3600);
            const mins: number = Math.floor((seconds % 3600) / 60);
            const secs: number = Math.floor(seconds % 60);

            if (hrs > 0) {
                return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
            }

            return `${mins}:${secs.toString().padStart(2, "0")}`;
        }

        export function formatMilliseconds(milliseconds: number, fixedSize: number = 2, withSpace: boolean = false, fullUnit: boolean = false): string {
            const singularUnits: string[] = (!fullUnit) ? ["ms", "s", "min", "h", "d"] : ["millisecond", "second", "minute", "hour", "day"];
            const plurialUnits: string[] = (!fullUnit) ? ["ms", "s", "min", "h", "d"] : ["milliseconds", "seconds", "minutes", "hours", "days"];

            const divisors: number[] = [1000, 60, 60, 24];

            let size: number = milliseconds;
            let unit: number = 0;

            while (unit < divisors.length && size >= divisors[unit]) {
                size /= divisors[unit];
                unit++;
            }

            const fixedCount: string = size.toFixed(fixedSize);
            const spaceWord: string = (withSpace) ? " " : "";
            const unitWord: string = Strings.pluralize(singularUnits[unit], plurialUnits[unit], size);

            return fixedCount + spaceWord + unitWord;
        }

        export function formatSeconds(seconds: number, fixedSize: number = 2, withSpace: boolean = false, fullUnit: boolean = false): string {
            return formatMilliseconds(seconds * 1000, fixedSize, withSpace, fullUnit);
        }

        export function formatMinutes(minutes: number, fixedSize: number = 2, withSpace: boolean = false, fullUnit: boolean = false): string {
            return formatMilliseconds(minutes * 60000, fixedSize, withSpace, fullUnit);
        }

        export function formatHours(hours: number, fixedSize: number = 2, withSpace: boolean = false, fullUnit: boolean = false): string {
            return formatMilliseconds(hours * 3600000, fixedSize, withSpace, fullUnit);
        }
    };

    export namespace Dates {
        export function toStringFR(date: Date, withYear: boolean = false): string {
            const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: (withYear ? "numeric" : undefined) };
            return date.toLocaleDateString("fr-FR", options);
        }

        export function toStringUS(date: Date, withHour: boolean = false): string {
            const datePart: string = [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, "0"),
                String(date.getDate()).padStart(2, "0"),
            ].join("-");

            if (!withHour) {
                return datePart;
            }

            const timePart: string = [
                String(date.getHours()).padStart(2, "0"),
                String(date.getMinutes()).padStart(2, "0"),
                String(date.getSeconds()).padStart(2, "0"),
            ].join("-");

            return `${datePart}_${timePart}`;
        }

        export function stringUStoFrontUS(date: string): string {
            return new Date(date).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        }

        export function join(day: number | string, month: number | string, year: number | string): string {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
    };

    export namespace Colors {
        export function blend(start: ColorRGB, end: ColorRGB, t: number): ColorRGB {
            return {
                r: Math.round(Maths.lerp(start.r, end.r, t)),
                g: Math.round(Maths.lerp(start.g, end.g, t)),
                b: Math.round(Maths.lerp(start.b, end.b, t)),
                a: Math.round(Maths.lerp(start.a ?? 1, end.a ?? 1, t)),
            };
        }

        export function rgbToHex(rgb: ColorRGB): string {
            return `#${rgb.r.toString(16).padStart(2, "0")}${rgb.g.toString(16).padStart(2, "0")}${rgb.b.toString(16).padStart(2, "0")}`;
        }
    };

    export namespace Api {
        type SuccessResult<T extends { readonly success: boolean }> = Extract<T, { readonly success: true }>;

        export function success<T extends { readonly success: boolean }>(args: Omit<SuccessResult<T>, "success">): SuccessResult<T> {
            return {
                success: true,
                ...args,
            } as SuccessResult<T>;
        }

        export function error(error: string): ApiResultError {
            return {
                success: false,
                error: error,
            };
        }
    };

    export namespace Ids {
        export function format<T extends ValueBase>(data: T[]): ID[] {
            return data.map<ID>((d: T) => d.id);
        }
    };

    export namespace Command {
        export async function execute<T>(command: string, args: string[], errorBase: string, events?: ExecuteCommandEvents<T>): Promise<T> {
            return await new Promise<T>((resolve: Resolve<T>, reject: Reject) => {
                const process: ChildProcessWithoutNullStreams = spawn(command, args);
                events?.onProcess?.(process);
        
                let stdout: string = "";
                process.stdout.on("data", (data: Buffer) => stdout = (events?.onStdout !== undefined) ? events.onStdout(stdout, data) : stdout + data.toString());

                let stderr: string = "";
                process.stderr.on("data", (data: Buffer) => stderr += data.toString());
        
                process.on("error", (error: Error) => {
                    const fullError: string = `${errorBase}: ${error.message}`;
                    console.log(fullError);
                    reject(new Error(fullError));
                });
        
                process.on("close", async (code: number | null) => {
                    if (code !== 0) {
                        const fullError: string = `${errorBase}: ${command} exited with code ${code}: ${stderr}`;
                        console.log(fullError);
                        reject(new Error(fullError));
                        return;
                    }

                    if (events?.onClose !== undefined) {
                        const res: T = await events.onClose(stdout);
                        resolve(res);
                    }
                    else {
                        resolve(null as T);
                    }
                });
            });
        }
    };
};

export default Functions;
