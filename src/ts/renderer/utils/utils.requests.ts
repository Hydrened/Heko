import "./utils.types.js";

async function request(phpFile: string, data: { [key: string]: any }): Promise<any> {
    const res: Response = await fetch(`https://killian-simon.fr/heko/requests/${phpFile}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    return await res.json();
}

export const user: any = {
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

export const playlist: any = {
    add: async (userID: ID, token: Token, name: string): Promise<any> => {
        return await request("playlist/add.php", { userID: userID, token: token, name: name });
    },

    get: async (userID: ID, token: Token): Promise<any> => {
        return await request("playlist/get.php", { userID: userID, token: token });
    },

    updateOpenedState: async (userID: ID, token: Token, openedPlaylistIDs: number[]): Promise<any> => {
        return await request("playlist/update-opened-state.php", { userID: userID, token: token, openedPlaylistIDs: openedPlaylistIDs });
    },
};
