export function removeChildren(parent: HTMLElement | Element | null): void {
    if (parent == null) {
        return;
    }

    [...parent.children].reverse().forEach((c: Element) => c.remove());
}

export function pluralize(singularWord: string, n: number): string {
    return singularWord + ((n > 1) ? "s" : "");
}
