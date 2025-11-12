import AppPath from "./../utils/utils.app-path.js";
import "./utils.types.js";

type App = import("../app.js").default;

async function request(phpFile: string, app: App | null = null, data: { [key: string]: any } = {}): Promise<any> {
    if (app != null) {
        const userData: UserData = app.account.getUserData();
        if (!app.account.isLoggedIn()) {
            return {
                success: false,
                error: "User is not logged in.",
            };
        }

        data["userID"] = userData.id!;
        data["token"] = userData.token!;
    }

    const res: Response = await fetch(`${AppPath}/requests/${phpFile}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    return await res.json();
}

async function uploadFile(phpFile: string, app: App, file: File): Promise<any> {
    const userData: UserData = app.account.getUserData();
    if (!app.account.isLoggedIn()) {
        return {
            success: false,
            error: "User is not logged in.",
        };
    }

    const formData = new FormData();
    formData.append("userID", String(userData.id!));
    formData.append("token", userData.token!);
    formData.append("file", file);

    const res: Response = await fetch(`${AppPath}/requests/${phpFile}`, {
        method: "POST",
        body: formData,
    });

    return await res.json();
}

export const app = {
    getResponse: async (): Promise<any> => {
        return await request("app/get-response.php");
    },
};

export const youtube = {
    search: async (app: App, query: string): Promise<any> => {
        return await request("youtube/search.php", app, { query: query });
    },
};

export const user = {
    isTokenValid: async (token: Token): Promise<any> => {
        return await request("user/is-token-valid.php", null, { token: token });
    },

    login: async (email: string, password: string): Promise<any> => {
        return await request("user/login.php", null, { email: email, password: password });
    },

    register: async (name: string, email: string, password: string, confirm: string): Promise<any> => {
        return await request("user/register.php", null, { name: name, email: email, password: password, confirm: confirm });
    },

    editName: async (app: App, name: string): Promise<any> => {
        return await request("user/edit-name.php", app, { name: name });
    },

    getSettings: async (app: App): Promise<any> => {
        return await request("user/get-settings.php", app);
    },
    
    saveSettings: async (app: App, settings: Settings): Promise<any> => {
        return await request("user/save-settings.php", app, { settings: settings });
    },

    addDownload: async (app: App, videoID: string): Promise<any> => {
        return await request("user/add-download.php", app, { videoID: videoID });
    },

    getDownloads: async (app: App): Promise<any> => {
        return await request("user/get-downloads.php", app);
    },

    sendDeleteConfirmation: async (app: App, email: string): Promise<any> => {
        return await request("user/send-remove-confirmation.php", app, { email: email });
    },
};

export const playlist = {
    add: async (app: App, name: string, thumbnailFileName: string): Promise<any> => {
        return await request("playlist/add.php", app, { name: name, thumbnailFileName: thumbnailFileName });
    },

    updateOpenedState: async (app: App, openedPlaylistIDs: number[]): Promise<any> => {
        return await request("playlist/update-opened-state.php", app, { openedPlaylistIDs: openedPlaylistIDs });
    },

    updatePosition: async (app: App, playlistID: ID, position: number): Promise<any> => {
        return await request("playlist/update-position.php", app, { playlistID: playlistID, position: position });
    },

    updateMergeToggle: async (app: App, mergedPlaylistID: ID, toggled: boolean): Promise<any> => {
        return await request("playlist/update-merge-toggle.php", app, { mergedPlaylistID: mergedPlaylistID, toggled: toggled });
    },

    remove: async (app: App, playlistIDs: ID[], thumbnailFileNames: string[]): Promise<any> => {
        return await request("playlist/remove.php", app, { playlistIDs: playlistIDs, thumbnailFileNames: thumbnailFileNames });
    },

    removeFromMergeContainer: async (app: App, playlistID: ID, mergedPlaylistID: ID): Promise<any> => {
        return await request("playlist/remove-from-merge-container.php", app, {playlistID: playlistID, mergedPlaylistID: mergedPlaylistID });
    },

    rename: async (app: App, playlistID: ID, newPlaylistName: string): Promise<any> => {
        return await request("playlist/rename.php", app, { playlistID: playlistID, newPlaylistName: newPlaylistName });
    },
    
    duplicate: async (app: App, playlistID: ID): Promise<any> => {
        return await request("playlist/duplicate.php", app, { playlistID: playlistID });
    },

    moveIn: async (app: App, parentPlaylistID: ID, playlistID: ID): Promise<any> => {
        return await request("playlist/move-in.php", app, { parentPlaylistID: parentPlaylistID, playlistID: playlistID });
    },

    mergeIn: async (app: App, playlistID: ID, mergedPlaylistID: ID): Promise<any> => {
        return await request("playlist/merge-in.php", app, { playlistID: playlistID, mergedPlaylistID: mergedPlaylistID });
    },

    get: async (app: App): Promise<any> => {
        return await request("playlist/get.php", app);
    },
};

export const thumbnail = {
    upload: async (app: App, thumbnailFile: File): Promise<any> => {
        return await uploadFile("thumbnail/upload.php", app, thumbnailFile );
    },

    update: async (app: App, playlistID: ID, thumbnailFileName: string): Promise<any> => {
        return await request("thumbnail/update.php", app, { playlistID: playlistID, thumbnailFileName: thumbnailFileName });
    },

    remove: async (app: App, playlistID: ID, thumbnailFileName: string): Promise<any> => {
        return await request("thumbnail/remove.php", app, { playlistID: playlistID, thumbnailFileName: thumbnailFileName });
    },
} ;

export const song = {
    addToApp: async (app: App, title: string, artist: string, songFileName: string): Promise<any> => {
        return await request("song/add-to-app.php", app, { title: title, artist: artist, songFileName: songFileName });
    },

    addToPlaylist: async (app: App, songIDs: ID[], playlistID: ID): Promise<any> => {
        return await request("song/add-to-playlist.php", app, { songIDs: songIDs, playlistID: playlistID });
    },

    upload: async (app: App, songFile: File): Promise<any> => {
        return await uploadFile("song/upload.php", app, songFile);
    },

    removeFromApp: async (app: App, songID: ID, songFileName: string): Promise<any> => {
        return await request("song/remove-from-app.php", app, { songID: songID, songFileName: songFileName });
    },

    removeFromPlaylist: async (app: App, playlistID: ID, songID: ID): Promise<any> => {
        return await request("song/remove-from-playlist.php", app, { playlistID: playlistID, songID: songID });
    },

    edit: async (app: App, songID: ID, title: string, artist: string): Promise<any> => {
        return await request("song/edit.php", app, { songID: songID, title: title, artist: artist });
    },

    get: async (app: App): Promise<any> => {
        return await request("song/get.php", app);
    },
};
