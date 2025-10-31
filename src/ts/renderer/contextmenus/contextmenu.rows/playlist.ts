import App from "./../../app.js";
import PlaylistManager from "./../../playlists/playlists.js";
import TopModal from "./../../modals/modal.top.js";
import openRemovePlaylistModal from "./../../modals/modal.center.open/remove.playlist.js";
import openRenamePlaylistModal from "./../../modals/modal.center.open/rename-playlist.js";
import * as Requests from "./../../utils/utils.requests.js";

async function duplicatePlaylistOnClick(app: App, userID: ID, token: Token, playlist: Playlist): Promise<void> {
    const duplicatePlaylistReqRes: any = await Requests.playlist.duplicate(userID, token, playlist.id);
    if (!duplicatePlaylistReqRes.success) {
        return app.throwError(`Can't duplicate playlist: ${duplicatePlaylistReqRes.error}`);
    }
    
    const newPlaylistID: number = (duplicatePlaylistReqRes.playlistID as number);

    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();
        app.playlistManager.open(newPlaylistID);
    });

    TopModal.create("SUCCESS", `Successfully duplicated playlist "${playlist.name}".`);
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

    const childrenIDs: ID[] = PlaylistManager.getPlaylistChildrenIDs(userPlaylists, playlist.id);

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
        return app.throwError(`Can't move playlist: ${movePlaylistInPlaylistReqRes.error}`);
    }

    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();
        app.playlistManager.refreshOpenedPlaylistTab();
    });

    TopModal.create("SUCCESS", `Successfully moved playlist "${playlist.name}" in playlist "${parentPlaylist.name}".`);
}

function getPlaylistMerge(app: App, userID: ID, token: Token, userPlaylists: Playlist[], playlist: Playlist): ContextmenuRow[] {
    // return userPlaylists.filter((userPlaylist: Playlist) => {
        

    // }).map((userPlaylist: Playlist) => {
    //     return {
    //         title: userPlaylist.name,
    //         onClick: async () => {},
    //         disabled: false,
    //     };
    // });

    return [];
}

export function getPlaylistRowShortcuts(): ShortcutMap {
    const res: ShortcutMap = {};
    res["rename"] = { ctrl: false, shift: false, alt: false, key: "F2" };
    res["remove"] = { ctrl: false, shift: false, alt: false, key: "Delete" };
    res["duplicate"] = { ctrl: true, shift: false, alt: false, key: "D" };
    return res;
}

export function getPlaylistRows(app: App, playlist: Playlist): ContextmenuRow[] {
    const userData: UserData = app.account.getUserData();
    if (userData.id == null || userData.token == null) {
        app.throwError("Can't get playlist contextmenu rows: User is not logged in.");
        return [];
    }

    const userID: ID = userData.id;
    const token: string = userData.token;

    const userPlaylists: Playlist[] = app.playlistManager.getPlaylistBuffer();
    const disableMoveIn: boolean = (userPlaylists.length == 0);
    const disableMerge: boolean = (userPlaylists.length == 0);

    const shortcuts: ShortcutMap = getPlaylistRowShortcuts();

    return [
        { title: "Rename", shortcut: shortcuts["rename"], onClick: async () => {
            openRenamePlaylistModal(app, playlist);
        }, disabled: false },

        { title: "Remove", shortcut: shortcuts["remove"], onClick: async () => {
            openRemovePlaylistModal(app, userPlaylists, playlist);
        }, disabled: false },

        { title: "Duplicate", shortcut: shortcuts["duplicate"], onClick: async () => {
            await duplicatePlaylistOnClick(app, userID, token, playlist);
        }, disabled: false },

        { title: "Move in", rows: getPlaylistMoveInRows(app, userID, token, userPlaylists, playlist), disabled: disableMoveIn },

        { title: "Merge", rows: getPlaylistMerge(app, userID, token, userPlaylists, playlist), disabled: disableMerge },
    ];
}
