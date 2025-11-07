let spamPrevent: boolean = false;

export async function prevent(promise: Promise<any>): Promise<any> {
    if (spamPrevent) {
        return;
    }

    spamPrevent = true;
    await promise;
    spamPrevent = false;
}
