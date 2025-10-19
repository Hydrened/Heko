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
    return "https://killian-simon.fr/heko/thumbnails/" + thumbnailFileName;
}

export function getSongPath(song: Song): string {
    return "https://killian-simon.fr/heko/songs/" + song.fileName;
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
