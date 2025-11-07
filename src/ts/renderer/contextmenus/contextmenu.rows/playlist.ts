import App from "./../../app.js";
import PlaylistManager from "./../../playlists/playlists.js";
import openRemovePlaylistModal from "./../../modals/modal.center.open/remove.playlist.js";
import openRenamePlaylistModal from "./../../modals/modal.center.open/rename-playlist.js";
import * as Requests from "./../../utils/utils.requests.js";

async function duplicatePlaylistOnClick(app: App, playlist: Playlist): Promise<void> {
    const duplicatePlaylistReqRes: any = await Requests.playlist.duplicate(app, playlist.id);
    if (!duplicatePlaylistReqRes.success) {
        return app.throwError(`Can't duplicate playlist: ${duplicatePlaylistReqRes.error}`);
    }
    
    const newPlaylistID: number = (duplicatePlaylistReqRes.playlistID as number);

    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();
        app.playlistManager.open(newPlaylistID);
    });

    app.modalManager.openTopModal("SUCCESS", `Successfully duplicated playlist "${playlist.name}".`);
}

function getPlaylistMoveToRows(app: App, playlist: Playlist): ContextmenuRow[] {
    const rootPlaylist: Playlist = {
        id: -1,
        parentID: -1,
        name: "ROOT",
        position: -1,
        thumbnailFileName: "",
        opened: true,
        mergedPlaylist: [],
        songs: [],
        children: 0,
        creationDate: "",
    };

    const playlists: Playlist[] = structuredClone(app.playlistManager.getPlaylistBuffer());

    if (playlist.parentID != -1) {
        playlists.unshift(rootPlaylist);
    }

    const childrenIDs: ID[] = PlaylistManager.getPlaylistChildrenIDs(playlists, playlist.id);

    return playlists.filter((p: Playlist) => {
        const isDifferent: boolean = (p.id != playlist.id);
        const hasNoSongs: boolean = (p.songs.length == 0);
        const isNotChildren: boolean = !childrenIDs.includes(p.id);
        const isNotDirectParent: boolean = (p.id != playlist.parentID);
        const isNotMergeContainer: boolean = (p.mergedPlaylist.length == 0);
        const isNotInMergeContainer: boolean = (playlists.every((p2: Playlist) => !p2.mergedPlaylist.map((mp: MergedPlaylist) => mp.id).includes(p.id)));
        
        return (isDifferent && hasNoSongs && isNotChildren && isNotDirectParent && isNotMergeContainer && isNotInMergeContainer);

    }).map((p: Playlist) => {
        return {
            title: p.name,
            onClick: async () => await playlistMoveToOnClick(app, p, playlist),
            disabled: false,
        };
    });
}

async function playlistMoveToOnClick(app: App, parentPlaylist: Playlist, playlist: Playlist): Promise<void> {
    const movePlaylistInPlaylistReqRes: any = await Requests.playlist.moveIn(app, parentPlaylist.id, playlist.id);
    if (!movePlaylistInPlaylistReqRes.success) {
        return app.throwError(`Can't move playlist: ${movePlaylistInPlaylistReqRes.error}`);
    }

    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();
        app.playlistManager.refreshOpenedPlaylistTab();
    });

    app.modalManager.openTopModal("SUCCESS", `Successfully moved playlist "${playlist.name}" in playlist "${parentPlaylist.name}".`);
}

function getPlaylistMergeInRows(app: App, playlist: Playlist): ContextmenuRow[] {
    const playlists: Playlist[] = app.playlistManager.getPlaylistBuffer();

    return playlists.filter((p: Playlist) => {
        const notSame: boolean = (p.id != playlist.id);
        const notParent: boolean = (p.children == 0);
        const hasNoSongs: boolean = (p.songs.length == 0);
        const isNotMergedIn: boolean = !p.mergedPlaylist.map((mp: MergedPlaylist) => mp.id).includes(playlist.id);
        const hasNeverBeenMerged: boolean = playlists.every((p2: Playlist) => !p2.mergedPlaylist.map((mp: MergedPlaylist) => mp.id).includes(p.id));

        return (notSame && notParent && hasNoSongs && isNotMergedIn && hasNeverBeenMerged);

    }).map((p: Playlist) => {
        return {
            title: p.name,
            onClick: async () => await playlistMergeInOnClick(app, p, playlist),
            disabled: false,
        };
    });
}

async function playlistMergeInOnClick(app: App, playlist: Playlist, mergedPlaylist: Playlist): Promise<void> {
    const mergePlaylistInPlaylistReqRes: any = await Requests.playlist.mergeIn(app, playlist.id, mergedPlaylist.id);
    if (!mergePlaylistInPlaylistReqRes.success) {
        return app.throwError(`Can't merge playlist: ${mergePlaylistInPlaylistReqRes.error}`);
    }

    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();
        app.playlistManager.refreshOpenedPlaylistTab();
    });

    app.modalManager.openTopModal("SUCCESS", `Successfully merged playlist "${mergedPlaylist.name}" in playlist "${playlist.name}".`);
}

export function getPlaylistRowShortcuts(): ShortcutMap {
    const res: ShortcutMap = {};
    res["rename"] = { ctrl: false, shift: false, alt: false, key: "F2" };
    res["remove"] = { ctrl: false, shift: false, alt: false, key: "Delete" };
    res["duplicate"] = { ctrl: true, shift: false, alt: false, key: "D" };
    return res;
}

export function getPlaylistRows(app: App, playlist: Playlist): ContextmenuRow[] {
    const moveInRows: ContextmenuRow[] = getPlaylistMoveToRows(app, playlist);
    const mergeInRows: ContextmenuRow[] = getPlaylistMergeInRows(app, playlist);

    const disableMoveIn: boolean = (moveInRows.length == 0);
    const disableMergeIn: boolean = (mergeInRows.length == 0 || playlist.children != 0 || playlist.mergedPlaylist.length != 0);

    const shortcuts: ShortcutMap = getPlaylistRowShortcuts();

    return [
        { title: "Rename", shortcut: shortcuts["rename"], onClick: async () => {
            openRenamePlaylistModal(app, playlist);
        }, disabled: false },

        { title: "Remove", shortcut: shortcuts["remove"], onClick: async () => {
            openRemovePlaylistModal(app, app.playlistManager.getPlaylistBuffer(), playlist);
        }, disabled: false },

        { title: "Duplicate", shortcut: shortcuts["duplicate"], onClick: async () => {
            await duplicatePlaylistOnClick(app, playlist);
        }, disabled: true }, // temp

        { title: "Move in", rows: moveInRows, disabled: disableMoveIn },

        { title: "Merge in", rows: mergeInRows, disabled: disableMergeIn },
    ];
}
