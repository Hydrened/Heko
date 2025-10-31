import AppPath from "./../utils/utils.app-path.js";
import "./utils.types.js";

async function request(phpFile: string, data: { [key: string]: any } = {}): Promise<any> {
    const res: Response = await fetch(`${AppPath}/requests/${phpFile}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    return await res.json();
}

async function uploadFile(phpFile: string, userID: ID, token: Token, file: File): Promise<any> {
    const formData = new FormData();
    formData.append("userID", String(userID));
    formData.append("token", token);
    formData.append("file", file);

    const res = await fetch(`${AppPath}/requests/${phpFile}`, {
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

export const user = {
    isTokenValid: async (token: Token): Promise<any> => {
        return await request("user/is-token-valid.php", { token: token });
    },

    login: async (email: string, password: string): Promise<any> => {
        return await request("user/login.php", { email: email, password: password });
    },

    register: async (name: string, email: string, password: string, confirm: string): Promise<any> => {
        return await request("user/register.php", { name: name, email: email, password: password, confirm: confirm });
    },

    getSettings: async (userID: ID, token: Token): Promise<any> => {
        return await request("user/get-settings.php", { userID: userID, token: token });
    },
    
    saveSettings: async (userID: ID, token: Token, settings: UserSettings): Promise<any> => {
        return await request("user/save-settings.php", { userID: userID, token: token, settings: settings });
    },
};

export const playlist = {
    add: async (userID: ID, token: Token, name: string, thumbnailFileName: string): Promise<any> => {
        return await request("playlist/add.php", { userID: userID, token: token, name: name, thumbnailFileName: thumbnailFileName });
    },

    updateOpenedState: async (userID: ID, token: Token, openedPlaylistIDs: number[]): Promise<any> => {
        return await request("playlist/update-opened-state.php", { userID: userID, token: token, openedPlaylistIDs: openedPlaylistIDs });
    },

    updatePosition: async (userID: ID, token: Token, playlistID: ID, position: number): Promise<any> => {
        return await request("playlist/update-position.php", { userID: userID, token: token, playlistID: playlistID, position: position });
    },

    remove: async (userID: ID, token: Token, playlistIDs: ID[], thumbnailFileNames: string[]): Promise<any> => {
        return await request("playlist/remove.php", { userID: userID, token: token, playlistIDs: playlistIDs, thumbnailFileNames: thumbnailFileNames });
    },

    rename: async (userID: ID, token: Token, playlistID: ID, newPlaylistName: string): Promise<any> => {
        return await request("playlist/rename.php", { userID: userID, token: token, playlistID: playlistID, newPlaylistName: newPlaylistName });
    },
    
    duplicate: async (userID: ID, token: Token, playlistID: ID): Promise<any> => {
        return await request("playlist/duplicate.php", { userID: userID, token: token, playlistID: playlistID });
    },

    moveIn: async (userID: ID, token: Token, parentPlaylistID: ID, playlistID: ID): Promise<any> => {
        return await request("playlist/move-in.php", { userID: userID, token: token, parentPlaylistID: parentPlaylistID, playlistID: playlistID });
    },

    get: async (userID: ID, token: Token): Promise<any> => {
        return await request("playlist/get.php", { userID: userID, token: token });
    },
};

export const thumbnail = {
    upload: async (userID: ID, token: Token, thumbnailFile: File): Promise<any> => {
        return await uploadFile("thumbnail/upload.php", userID, token, thumbnailFile );
    },

    update: async (userID: ID, token: Token, playlistID: ID, thumbnailFileName: string): Promise<any> => {
        return await request("thumbnail/update.php", { userID: userID, token: token, playlistID: playlistID, thumbnailFileName: thumbnailFileName });
    },

    remove: async (userID: ID, token: Token, playlistID: ID, thumbnailFileName: string): Promise<any> => {
        return await request("thumbnail/remove.php", { userID: userID, token: token, playlistID: playlistID, thumbnailFileName: thumbnailFileName });
    },
} ;

export const song = {
    addToApp: async (userID: ID, token: Token, title: string, artist: string, songFileName: string): Promise<any> => {
        return await request("song/add-to-app.php", { userID: userID, token: token, title: title, artist: artist, songFileName: songFileName });
    },

    addToPlaylist: async (userID: ID, token: Token, songID: ID, playlistID: ID): Promise<any> => {
        return await request("song/add-to-playlist.php", { userID: userID, token: token, songID: songID, playlistID: playlistID });
    },

    upload: async (userID: ID, token: Token, songFile: File): Promise<any> => {
        return await uploadFile("song/upload.php", userID, token, songFile);
    },

    removeFromApp: async (userID: ID, token: Token, songID: ID, songFileName: string): Promise<any> => {
        return await request("song/remove-from-app.php", { userID: userID, token: token, songID: songID, songFileName: songFileName });
    },

    removeFromPlaylist: async (userID: ID, token: Token, playlistID: ID, songID: ID): Promise<any> => {
        return await request("song/remove-from-playlist.php", { userID: userID, token: token, playlistID: playlistID, songID: songID });
    },

    edit: async (userID: ID, token: Token, songID: ID, title: string, artist: string): Promise<any> => {
        return await request("song/edit.php", { userID: userID, token: token, songID: songID, title: title, artist: artist });
    },

    get: async (userID: ID, token: Token): Promise<any> => {
        return await request("song/get.php", { userID: userID, token: token });
    },
};
