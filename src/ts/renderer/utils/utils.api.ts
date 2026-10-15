import "./utils.types.js";

const w: any = (window as any);

namespace Api {
    async function fileToBase64(file: File): Promise<string> {
        return new Promise<string>((resolve: Resolve<string>, reject: Reject) => {
            const reader: FileReader = new FileReader();
            reader.onload = (): void => {
                const result: string = reader.result as string;
                resolve(result.split(",")[1]);
            };
            reader.onerror = (): void => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    async function request<T>(phpFile: string, data: Record<string, unknown> = {}): Promise<T> {
        const payload: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(data)) {
            payload[key] = (value instanceof File) ? await fileToBase64(value) : value ?? "";
        }

        const res: Response = await fetch(`https://hekoplayer.app/apiv2/${phpFile}`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-Auth-Client": "heko-app-00-SHIELD-98",
            },
            body: JSON.stringify(payload),
        });

        try {
            return await res.json() as T;
        }
        catch (err: unknown) {
            console.error(err);
            return null as T;
        }
    }

    export namespace Artist {
        export async function create(name: string): Promise<CreateArtistApiResult> {
            return await request("artist/create.php", { name: name });
        }
    };

    export namespace Dialog {
        export async function askForFile(title: string, name?: string, extenstions?: string[]): Promise<AskForFileApiResult> {
            return await w.api.dialog.askForFile(title, name, extenstions);
        }
    };

    export namespace Files {
        export async function read(path: string): Promise<ReadFileApiResult> {
            return await w.api.files.read(path);
        }
    };

    export namespace Playlists {
        export async function create(name: string, thumbnail: File | null): Promise<CreatePlaylistApiResult> {
            return await request("playlists/create.php", { name: name, thumbnail: thumbnail });
        }

        export async function edit(id: ID, name: string, thumbnail: File | null, thumbnailEditType: ThumbnailEditType): Promise<EditPlaylistApiResult> {
            return await request("playlists/edit.php", { id: id, name: name, thumbnail: thumbnail, thumbnailEditType: thumbnailEditType });
        }

        export async function get(id: ID): Promise<GetUserPlaylistApiResult> {
            return await request("playlists/get.php", { id: id });
        }

        export async function getAll(): Promise<GetUserPlaylistsApiResult> {
            return await request("playlists/get-all.php");
        }

        export async function mergeIn(mergeContainerId: ID, id: ID): Promise<MergePlaylistInApiResult> {
            return await request("playlists/merge-in.php", { mergeContainerId: mergeContainerId, id: id });
        }

        export async function remove(id: ID): Promise<RemoveUserPlaylistApiResult> {
            return await request("playlists/remove.php", { id: id });
        }
    };

    export namespace Temp {
        export async function clear(): Promise<ClearTempApiResult> {
            return await w.api.temp.clear();
        }

        export async function pasteClipbordImage(): Promise<PasteClipbordImageApiResult> {
            return await w.api.temp.pasteClipbordImage();
        }
    };

    export namespace User {
        export async function isLogged(): Promise<IsLoggedApiResult> {
            return await request("user/is-logged.php");
        }

        export async function login(email: string, password: string): Promise<LoginApiResult> {
            return await request("user/login.php", { email: email, password: password });
        }

        export async function logout(): Promise<LogoutApiResult> {
            return await request("user/logout.php");
        }

        export async function register(name: string, email: string, password: string, confirm: string): Promise<RegisterApiResult> {
            return await request("user/register.php", { name: name, email: email, password: password, confirm: confirm });
        }
    };

    export namespace Window {
        export async function minimize(): Promise<void> {
            return await w.win.minimize();
        }

        export async function maximize(): Promise<void> {
            return await w.win.maximize();
        }

        export async function close(): Promise<void> {
            return await w.win.close();
        }

        export async function setTitle(title: string): Promise<void> {
            return await w.win.setTitle(title);
        }

        export async function onStart(callback: (args: AppArgs) => void): Promise<void> {
            return await w.win.onStart(callback);
        }

        export async function onClose(callback: () => Promise<void>): Promise<void> {
            return await w.win.onClose(callback);
        }

        export async function onClosed(callback: () => Promise<void>): Promise<void> {
            return await w.win.onClosed(callback);
        }
    };
};

export default Api;
