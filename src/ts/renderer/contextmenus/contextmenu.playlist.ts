import App from "./../app.js";
import CenterModal from "./../modals/modal.center.js";
import TopModal from "./../modals/modal.top.js";
import * as Requests from "./../utils/utils.requests.js";

async function renamePlaylistOnConfirm(app: App, userID: ID, token: Token, playlist: Playlist, modal: CenterModal): Promise<ModalError> {
    const newPlaylistName: string = modal.getFieldValue("New name");

    const renamePlaylistReqRes: any = await Requests.playlist.rename(userID, token, playlist.id, newPlaylistName);
    if (!renamePlaylistReqRes.success) {
        app.throwError(`Can't rename playlist: ${renamePlaylistReqRes.error}`);
        return null;
    }
    
    app.playlistManager.refreshPlaylistsContainerTab();
    if (app.playlistManager.getCurrentOpenedPlaylist()?.id == playlist.id) {
        app.playlistManager.refreshOpenedPlaylistTab();
    }

    TopModal.create("SUCCESS", `Successfully renamed playlist "${playlist.name}" to "${newPlaylistName}".`);
    return null;
}

function getRenamePlaylistModalData(app: App, userID: ID, token: Token, playlist: Playlist): CenterModalData {
    return {
        title: `Rename playlist "${playlist.name}".`,
        content: [
            { label: "New name", type: "TEXT", defaultValue: playlist.name, maxLength: 150 },
        ],
        onConfirm: async (modal: CenterModal) => await renamePlaylistOnConfirm(app, userID, token, playlist, modal),
        cantClose: false,
    };
}

async function removePlaylistOnConfirm(app: App, userID: ID, token: Token, userPlaylists: Playlist[], playlist: Playlist, modal: CenterModal): Promise<ModalError> {
    const childrenIDs: ID[] = getPlaylistChildrenIDs(userPlaylists, playlist.id);

    const getPlaylistsFromUserReqRes: any = await Requests.playlist.getAllFromUser(userID, token);
    if (!getPlaylistsFromUserReqRes.success) {
        app.throwError(`Can't get playlists from user: ${getPlaylistsFromUserReqRes.error}`);
        return null;
    }

    const playlists: Playlist[] = (getPlaylistsFromUserReqRes.playlists as Playlist[]);
    const thumbnailFileNames: string[] = playlists.filter((p: Playlist) => (childrenIDs.includes(p.id) || p.id == playlist.id)).map((p: Playlist) => p.thumbnailFileName);

    const removePlaylistReqRes: any = await Requests.playlist.remove(userID, token, childrenIDs.concat(playlist.id), thumbnailFileNames);
    if (!removePlaylistReqRes.success) {
        app.throwError(`Can't remove playlist: ${removePlaylistReqRes.error}`);
        return null;
    }
    
    app.playlistManager.refreshPlaylistsContainerTab();
    if (app.playlistManager.getCurrentOpenedPlaylist()?.id == playlist.id) {
        app.playlistManager.close();
        app.openFirstPlaylist();
    }

    TopModal.create("SUCCESS", `Successfully removed playlist "${playlist.name}".`);
    return null;
}

function getRemovePlaylistModalData(app: App, userID: ID, token: Token, userPlaylists: Playlist[], playlist: Playlist): CenterModalData {
    return {
        title: `Are you sure you want to remove playlist "${playlist.name}"? Children playlist(s) will also be deleted.`,
        onConfirm: async (modal: CenterModal) => await removePlaylistOnConfirm(app, userID, token, userPlaylists, playlist, modal),
        cantClose: false,
    };
}

async function duplicatePlaylistOnClick(app: App, userID: ID, token: Token, playlist: Playlist): Promise<void> {
    const duplicatePlaylistReqRes: any = await Requests.playlist.duplicate(userID, token, playlist.id);
    if (!duplicatePlaylistReqRes.success) {
        return app.throwError(`Can't duplicate playlist: ${duplicatePlaylistReqRes.error}`);
    }
    
    const newPlaylistID: number = (duplicatePlaylistReqRes.playlistID as number);

    app.playlistManager.refreshPlaylistsContainerTab();
    app.playlistManager.open(newPlaylistID);
    TopModal.create("SUCCESS", `Successfully duplicated playlist "${playlist.name}".`);
}

function getPlaylistChildrenIDs(playlists: Playlist[], parentID: ID): ID[] {
    const children = playlists.filter((playlist: Playlist) => playlist.parentID == parentID);
    const res: ID[] = [];

    for (const child of children) {
        res.push(child.id);
        res.push(...getPlaylistChildrenIDs(playlists, child.id));
    }

    return res;
}

function getPlaylistMoveInRows(app: App, userID: ID, token: Token, userPlaylists: Playlist[], playlist: Playlist): ContextmenuRow[] {
    const rootPlaylist: Playlist = {
        id: -1,
        userID: -1,
        parentID: -1,
        name: "ROOT",
        position: -1,
        thumbnailFileName: "",
        opened: true,
        songs: 0,
        children: 0,
        creationDate: "",
    };

    if (playlist.parentID != -1) {
        userPlaylists.unshift(rootPlaylist);
    }

    const childrenIDs: ID[] = getPlaylistChildrenIDs(userPlaylists, playlist.id);

    return userPlaylists.filter((userPlaylist: Playlist) => {
        const isDifferent: boolean = (userPlaylist.id != playlist.id);
        const hasNoSongs: boolean = (userPlaylist.songs == 0);
        const isNotChildren: boolean = !childrenIDs.includes(userPlaylist.id);
        const isNotDirectParent: boolean = (userPlaylist.id != playlist.parentID);

        return (isDifferent && hasNoSongs && isNotChildren && isNotDirectParent);

    }).map((userPlaylist: Playlist) => {
        return {
            title: userPlaylist.name,
            onClick: async () => await playlistMoveToOnClick(app, userID, token, userPlaylist, playlist),
            disabled: false,
        };
    });
}

async function playlistMoveToOnClick(app: App, userID: ID, token: Token, parentPlaylist: Playlist, playlist: Playlist): Promise<void> {
    const movePlaylistInPlaylistReqRes: any = await Requests.playlist.moveIn(userID, token, parentPlaylist.id, playlist.id);
    if (!movePlaylistInPlaylistReqRes.success) {
        return app.throwError(`Can't get playlists from user: ${movePlaylistInPlaylistReqRes.error}`);
    }

    app.playlistManager.refreshPlaylistsContainerTab();
    TopModal.create("SUCCESS", `Successfully moved playlist "${playlist.name}" in playlist "${parentPlaylist.name}".`);
}

function getPlaylistMerge(app: App, userID: ID, token: Token, userPlaylists: Playlist[], playlist: Playlist): ContextmenuRow[] {
    return userPlaylists.filter((userPlaylist: Playlist) => {
        

    }).map((userPlaylist: Playlist) => {
        return {
            title: userPlaylist.name,
            onClick: async () => {},
            disabled: false,
        };
    });
}

export async function getPlaylistRows(app: App, playlist: Playlist): Promise<ContextmenuRow[]> {
    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        app.throwError("Can't get playlist contextmenu rows: User is not connected.");
        return [];
    }

    const userID: ID = userData.id;
    const token: string = userData.token;

    const getPlaylistsFromUserReqRes: any = await Requests.playlist.getAllFromUser(userID, token);
    if (!getPlaylistsFromUserReqRes.success) {
        app.throwError(`Can't get playlists from user: ${getPlaylistsFromUserReqRes.error}`);
        return [];
    }

    const userPlaylists: Playlist[] = (getPlaylistsFromUserReqRes.playlists as Playlist[]);
    const disableMoveIn: boolean = (userPlaylists.length == 0);
    const disableMerge: boolean = (false && (userPlaylists.length == 0));

    return [
        { title: "Rename", shortcut: { ctrl: false, shift: false, alt: false, key: "F2" }, onClick: async () => {
            new CenterModal(app, getRenamePlaylistModalData(app, userID, token, playlist));
        }, disabled: false },

        { title: "Remove", shortcut: { ctrl: false, shift: false, alt: false, key: "Suppr" }, onClick: async () => {
            new CenterModal(app, getRemovePlaylistModalData(app, userID, token, userPlaylists, playlist));
        }, disabled: false },

        { title: "Duplicate", shortcut: { ctrl: true, shift: false, alt: false, key: "D" }, onClick: async () => {
            await duplicatePlaylistOnClick(app, userID, token, playlist);
        }, disabled: false },

        { title: "Move in", rows: getPlaylistMoveInRows(app, userID, token, userPlaylists, playlist), disabled: disableMoveIn },

        { title: "Merge", rows: getPlaylistMerge(app, userID, token, userPlaylists, playlist), disabled: disableMerge },
    ];
}
