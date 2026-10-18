import "./utils.types.js";

namespace Functions {
    const version: number = 1.11;

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

    export namespace SearchParameter {
        export function get(name: string): string {
            const parameters: URLSearchParams = new URLSearchParams(window.location.search);
            return (parameters.get(name) ?? "");
        }

        export function getAsString(key: string): string | null {
            const res: string | null = get(key);
            if (res === null || res === "") {
                return null;
            }

            return res;
        }

        export function getAsNumber(key: string): number | null {
            const id: number = Number(get(key));
            if (isNaN(id)) {
                return null;
            }

            return id;
        }

        export function getAsBoolean(key: string): boolean {
            return (get(key) === "1");
        }
    };

    export namespace Css {
        export function get(variable: string, type?: CssVariableType): any {
            const res: string = getComputedStyle(document.documentElement).getPropertyValue(`--${variable}`).trim();
            if (type === undefined) {
                return res;
            }

            switch (type) {
                case "pixel":
                case "ms-duration": return Number(res.substring(0, res.length - 2));
                case "rem": return Number(res.substring(0, res.length - 3));
                case "hex-color": return {
                    r: parseInt(res.substring(1, 3), 16),
                    g: parseInt(res.substring(3, 5), 16),
                    b: parseInt(res.substring(5, 7), 16),
                    a: parseInt(res.substring(7, 9), 16),
                };
                    
                default: return res;
            }
        }

        export function set(variable: string, value: string): void {
            document.documentElement.style.setProperty(`--${variable}`, value);
        }
    };

    export namespace Elements {
        export function createInput(type: string, name: string, placeholder?: string): HTMLInputElement {
            const inputElement: HTMLInputElement = document.createElement("input");
            inputElement.type = type;
            inputElement.name = name;
            inputElement.placeholder = placeholder ?? "";
            inputElement.autocomplete = "off";
            inputElement.autocapitalize = "off";
            inputElement.spellcheck = false;
            inputElement.autocorrect = false;
            return inputElement;
        }

        export function disable(...elements: HTMLElement[]): void {
            elements.forEach((element: HTMLElement) => {
                element.classList.add("disabled");
                element.setAttribute("disabled", "");
            });
        }

        export function enable(...elements: HTMLElement[]): void {
            elements.forEach((element: HTMLElement) => {
                element.classList.remove("disabled");
                element.removeAttribute("disabled");
            });
        }

        export function isDisabled(element: HTMLElement): boolean {
            return element.classList.contains("disabled") && element.hasAttribute("disabled");
        }

        export function isEnabled(element: HTMLElement): boolean {
            return !isDisabled(element);
        }

        export function hide(...elements: HTMLElement[]): void {
            elements.forEach((element: HTMLElement) => element.classList.add("hidden"));
        }

        export function show(...elements: HTMLElement[]): void {
            elements.forEach((element: HTMLElement) => element.classList.remove("hidden"));
        }

        export async function antiSpam<T>(element: HTMLElement, action: () => Promise<T>): Promise<T | null> {
            const antiSpamClassName: string = "anti-spam";

            if (element.classList.contains(antiSpamClassName)) {
                return null;
            }

            element.classList.add(antiSpamClassName);

            try {
                return await action();
            }
            finally {
                element.classList.remove(antiSpamClassName);
            }
        }

        export function removeChildren(parent: HTMLElement | Element | null, condition?: (element: Element) => boolean): void {
            if (parent === null) {
                return;
            }

            const children: Element[] = [...parent.children].reverse();

            children.forEach((c: Element) => {
                if (condition === undefined || condition(c)) {
                    c.remove();
                }
            });
        }

        export function reverseChildren(parent: HTMLElement | Element | null): void {
            if (parent === null) {
                return;
            }

            [...parent.children].reverse().forEach((c: Element) => parent.appendChild(c));
        }

        export function fillSelect<T extends ValueBase>(selectElement: HTMLSelectElement, options: T[], defaultValue?: ID): void {
            options.forEach((option: T) => {
                const optionElement: HTMLOptionElement = document.createElement("option");
                optionElement.textContent = option.name;
                optionElement.value = String(option.id);
                selectElement.appendChild(optionElement);

                if (option.id === defaultValue) {
                    optionElement.selected = true;
                }
            });
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
            const lastSeparatorIndex: number = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));

            const lastPointIndex: number = filePath.lastIndexOf(".");
            if (lastSeparatorIndex === filePath.length - 1) {
                throw new Error(`Could not get file name: Path is invalid.`);
            }

            const fileNameStartIndex: number = lastSeparatorIndex + 1;
            if (lastPointIndex <= fileNameStartIndex) {
                return filePath.slice(fileNameStartIndex);
            }

            return filePath.slice(fileNameStartIndex, lastPointIndex);
        }

        export function getFullName(filePath: string): string {
            return `${getName(filePath)}${getExtension(filePath)}`;
        }

        export function getExtension(filePath: string, withPoint: boolean = true): string {
            const lastSlashIndex: number = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));

            const lastPointIndex: number = filePath.lastIndexOf(".");
            if (lastPointIndex <= lastSlashIndex || lastPointIndex === filePath.length - 1) {
                throw new Error(`Could not get file extension: Path is invalid.`);
            }

            const extension: string = filePath.slice(lastPointIndex).toLowerCase();
            return withPoint ? extension : extension.slice(1);
        }

        export function getDirectory(filePath: string): string {
            const errorBase: string = "Could not get file directory";

            const hasSlashes: boolean = filePath.includes("/");
            const hasBackslashes: boolean = filePath.includes("\\");

            if (!hasSlashes && !hasBackslashes) {
                throw new Error(`${errorBase}: Path is invalid.`);
            }

            filePath = (hasSlashes) ? Functions.Paths.toSlashes(filePath) : Functions.Paths.toBackslashes(filePath);

            const separator: string = hasSlashes ? "/" : "\\";
            const lastSeparatorIndex : number = filePath.lastIndexOf(separator);

            if (lastSeparatorIndex  === -1) {
                throw new Error(`${errorBase}: Path is invalid.`);
            }

            return filePath.slice(0, lastSeparatorIndex);
        }

        export function getMimeType(filePath: string): string {
            const ext: string = getExtension(filePath, false);

            const mimeTypes: Record<string, string> = {
                png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
                webp: "image/webp", bmp: "image/bmp", svg: "image/svg+xml", avif: "image/avif",
                ico: "image/x-icon",
                mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", flac: "audio/flac",
                mp4: "video/mp4", webm: "video/webm", mkv: "video/x-matroska",
                pdf: "application/pdf", txt: "text/plain", csv: "text/csv",
                json: "application/json", xml: "application/xml", html: "text/html",
                doc: "application/msword",
                docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                xls: "application/vnd.ms-excel",
                xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                zip: "application/zip", gz: "application/gzip", "7z": "application/x-7z-compressed",
            };

            return mimeTypes[ext] ?? "application/octet-stream";
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

    export namespace Ids {
        export function format<T extends ValueBase>(data: T[]): ID[] {
            return data.map<ID>((d: T) => d.id);
        }
    };

    export namespace Heko {
        const thumbnailPath = "https://hekoplayer.app/thumbnails";

        export function setThumbnail(thumbnailELement: HTMLElement, thumbnailFileName?: string): void {
            if (thumbnailFileName === undefined || thumbnailFileName === "") {
                thumbnailELement.classList.add("null-thumbnail");
                thumbnailELement.style.backgroundImage = "";
                return;
            }

            const fullThumbnailPath: string = `${thumbnailPath}/${thumbnailFileName}`;
            thumbnailELement.classList.remove("null-thumbnail");
            thumbnailELement.style.backgroundImage = `url(${fullThumbnailPath})`;
        }

        export function getThumbnailPath(thumbnailFileName: string): string {
            return `${thumbnailPath}/${thumbnailFileName}`;
        }

        export function isNewThumbnail(path: string): boolean {
            return !path.startsWith(thumbnailPath);
        }

        export function getPlaylistDescendants(playlists: Playlist[], playlistId: ID): Playlist[] {
            const childrenByParent: Map<ID, Playlist[]> = new Map<ID, Playlist[]>();

            for (const p of playlists) {
                const siblings: Playlist[] = childrenByParent.get(p.parentId) ?? [];
                siblings.push(p);
                childrenByParent.set(p.parentId, siblings);
            }

            const result: Playlist[] = [];
            const stack: Playlist[] = [...(childrenByParent.get(playlistId) ?? [])];

            while (stack.length > 0) {
                const p: Playlist = stack.pop()!;
                result.push(p);
                stack.push(...(childrenByParent.get(p.id) ?? []));
            }

            return result;
        };

        export function isPlaylistChild(playlists: Playlist[], parentPlaylistId: ID, playlistId: ID): boolean {
            return getPlaylistDescendants(playlists, parentPlaylistId).some((descendant: Playlist) => descendant.id === playlistId);
        }

        export function isPlaylistParent(playlists: Playlist[], parentPlaylistId: ID, playlistId: ID): boolean {
            return isPlaylistChild(playlists, parentPlaylistId, playlistId);
        }
    };
};

export default Functions;
