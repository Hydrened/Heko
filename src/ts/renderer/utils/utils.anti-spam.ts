let spamPrevent: boolean = false;

export async function prevent(call: () => Promise<void>): Promise<void> {
    if (spamPrevent) {
        return;
    }

    spamPrevent = true;
    await call();
    spamPrevent = false;
}
