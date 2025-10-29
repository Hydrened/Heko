import AppPath from "./utils.app-path.js";
import "./utils.types.js";

export function removeChildren(parent: HTMLElement | Element | null): void {
    if (parent == null) {
        return;
    }

    [...parent.children].reverse().forEach((c: Element) => c.remove());
}

export function pluralize(singularWord: string, n: number): string {
    return singularWord + ((n > 1) ? "s" : "");
}

export function shortcutToString(shortcut: Shortcut): string {
    const buffer: string[] = [];

    if (shortcut.ctrl) {
        buffer.push("Ctrl");
    }
    if (shortcut.shift) {
        buffer.push("Shift");
    }
    if (shortcut.alt) {
        buffer.push("Alt");
    }
    buffer.push(shortcut.key);

    return buffer.join("+");
}

export function testShortcut(e: KeyboardEvent, shortcut: Shortcut): boolean {
    const ctrl: boolean = (shortcut.ctrl == e.ctrlKey);
    const alt: boolean = (shortcut.alt == e.altKey);
    const shift: boolean = (shortcut.shift == e.shiftKey);
    const key: boolean = (shortcut.key.toLowerCase() == e.key.toLowerCase());

    return (ctrl && alt && shift && key);
}

export async function testShortcuts(e: KeyboardEvent, shortcuts: ShortcutMap, contextmenuRowsPromise: (...args: any[]) => ContextmenuRow[] | Promise<ContextmenuRow[]>, ...args: any[]): Promise<boolean> {
    const shortCutIsValid: boolean = Object.values(shortcuts).some((shortcut: Shortcut) => testShortcut(e, shortcut));
    if (!shortCutIsValid) {
        return false;
    }

    const contextmenuRows: ContextmenuRow[] = await contextmenuRowsPromise(...args);
    return contextmenuRows.some((row: ContextmenuRow) => {
        if (row.disabled) {
            return false;
        }

        if (row.onClick == undefined) {
            return false;
        }

        if (row.shortcut == undefined) {
            return false;
        }

        if (!testShortcut(e, row.shortcut)) {
            return false;
        }

        row.onClick();
        return true;
    });
}

export function getThumbnailPath(thumbnailFileName: string): string {
    return `${AppPath}/thumbnails/${thumbnailFileName}`;
}

export function getSongPath(song: Song): string {
    return `${AppPath}/songs/${song.fileName}`;
}

export function formatDuration(seconds: number): string {
    const hrs: number = Math.floor(seconds / 3600);
    const mins: number = Math.floor((seconds % 3600) / 60);
    const secs: number = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function randomIntInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomValueFromArray<T>(values: T[]): T {
    return values[randomIntInRange(0, values.length - 1)];
}

type CssVariableType = "PIXEL" | "MS_DURATION";

export function getCssVariable(variable: string, type: CssVariableType | null): any {
    const res: string = getComputedStyle(document.documentElement).getPropertyValue(`--${variable}`).trim();

    if (type == null) {
        return res;
    }

    switch (type) {
        case "PIXEL":
        case "MS_DURATION": return Number(res.substring(0, res.length - 2));
        
        default: return res;
    }
}

export function isCenterModalAlreadyOpened(): boolean {
    return (document.querySelector(".center-modal-container") != null);
}
