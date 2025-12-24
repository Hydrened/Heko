import App from "./../../app.js";
import CenterSearchModal from "./../modal.center.search.js";
import * as Requests from "./../../utils/utils.requests.js";

function modalOnCreate(app: App, playlistsLeft: Playlist[], container: HTMLElement): void {
    playlistsLeft.forEach((playlistLeft: Playlist) => createPlaylistContainer(app, playlistLeft, container));
}

function createPlaylistContainer(app: App, playlistLeft: Playlist, container: HTMLElement): void {
    const liElement: HTMLElement = CenterSearchModal.createCheckboxRow(playlistLeft.name, playlistLeft.thumbnailFileName);
    liElement.setAttribute("playlist-id", String(playlistLeft.id));
    container.appendChild(liElement);

    liElement.addEventListener("contextmenu", (e: PointerEvent) => app.contextmenuManager.createPlaylistContextMenu((e as Position), playlistLeft));
}

async function modalOnConfirm(app: App, song: Song, modal: CenterModal, container: HTMLElement): Promise<ModalError> {
    const playlistIDsToAdd: ID[] = (modal as CenterSearchModal).getCheckedElements().map((li: HTMLElement) => {
        return (app.playlistManager.getPlaylistFromElement(li));
    }).filter((playlist: Playlist | null) => playlist != null).map((playlist: Playlist) => playlist.id);

    const addSongsToPlaylistReqRes: any = await Requests.song.addToPlaylist(app, [song.id], playlistIDsToAdd);
    if (!addSongsToPlaylistReqRes.success) {
        app.throwError(`Can't add "${song.title}" by "${song.artist}" to playlists: ${addSongsToPlaylistReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshPlaylistBuffer().then(async () => {
        await app.playlistManager.refreshSongBuffer();
        app.playlistManager.refreshPlaylistsContainerTab();
        app.playlistManager.refreshOpenedPlaylistTab();
        app.listenerManager.refresh();
    });

    app.modalManager.openTopModal("SUCCESS", `Successfully added "${song.title}" by "${song.artist}" to playlists.`);
    return null;
}

async function modalOnSearch(app: App, container: HTMLElement, query: string): Promise<void> {
    query = query.toLowerCase();

    const playlistElements: HTMLElement[] = [...container.querySelectorAll<HTMLElement>("li")];
    playlistElements.forEach((playlistElement: HTMLElement) => {
        const playlist: Playlist | null = app.playlistManager.getPlaylistFromElement(playlistElement);
        if (playlist == null) {
            return app.throwError("Can't get playlist from element: Playlist is null.");
        }

        const hidden: boolean = !playlist.name.toLowerCase().includes(query);

        playlistElement.classList.remove("hidden");
        if (hidden) {
            playlistElement.classList.add("hidden");
        }
    });
}

export default function openAddSongToPlaylistsModal(app: App, playlistsLeft: Playlist[], song: Song): void {
    const currentOpenedPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentOpenedPlaylist == null) {
        return app.throwError("Can't open add songs to playlist modal: Current opened playlist is null.");
    }

    const data: CenterSearchModalData = {
        title: `Add song "${song.title}" by "${song.artist}" in playlists`,
        onCreate: (container: HTMLElement) => modalOnCreate(app, playlistsLeft, container),
        onConfirm: async (modal: CenterModal, container: HTMLElement) => await modalOnConfirm(app, song, modal, container),
        onSearch: async (container: HTMLElement, query: string) => modalOnSearch(app, container, query),
        searchDelay: 0,
        cantClose: false,
    };

    app.modalManager.openCenterSearchModal(data);
}
