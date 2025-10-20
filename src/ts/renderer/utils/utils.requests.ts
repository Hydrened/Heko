import "./utils.types.js";

async function request(phpFile: string, data: { [key: string]: any }): Promise<any> {
    const res: Response = await fetch(`https://killian-simon.fr/heko/requests/${phpFile}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    return await res.json();
}

async function uploadFile(phpFile: string, userID: ID, token: Token, songFile: File): Promise<any> {
    const formData = new FormData();
    formData.append("userID", String(userID));
    formData.append("token", token);
    formData.append("songFile", songFile);

    const res = await fetch(`https://killian-simon.fr/heko/requests/${phpFile}`, {
        method: "POST",
        body: formData,
    });

    return await res.json();
}

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
};

export const playlist = {
    add: async (userID: ID, token: Token, name: string): Promise<any> => {
        return await request("playlist/add.php", { userID: userID, token: token, name: name });
    },

    updateOpenedState: async (userID: ID, token: Token, openedPlaylistIDs: number[]): Promise<any> => {
        return await request("playlist/update-opened-state.php", { userID: userID, token: token, openedPlaylistIDs: openedPlaylistIDs });
    },

    get: async (userID: ID, token: Token, playlistID: ID): Promise<any> => {
        return await request("playlist/get.php", { userID: userID, token: token, playlistID: playlistID });
    },

    getAllFromUser: async (userID: ID, token: Token): Promise<any> => {
        return await request("playlist/get-all-from-user.php", { userID: userID, token: token });
    },
};

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

    removeFromPlaylist: async (userID: ID, token: Token, songID: ID): Promise<any> => {
        return await request("song/remove-from-playlist.php", { userID: userID, token: token, songID: songID });
    },

    getAllFromUser: async (userID: ID, token: Token): Promise<any> => {
        return await request("song/get-all-from-user.php", { userID: userID, token: token });
    },

    getFromPlaylist: async (userID: ID, token: Token, playlistID: ID): Promise<any> => {
        return await request("song/get-from-playlist.php", { userID: userID, token: token, playlistID: playlistID });
    },
};
