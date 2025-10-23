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
