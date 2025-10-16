export function removeChildren(parent: HTMLElement | null): void {
    if (parent == null) {
        return;
    }

    [...parent.children].reverse().forEach((c: Element) => c.remove());
}

export function displayWord(singularWord: string, n: number): string {
    return singularWord + ((n > 1) ? "s" : "");
}
