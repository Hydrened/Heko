import App from "./../../app.js";
import * as Requests from "./../../utils/utils.requests.js";
import * as Functions from "./../../utils/utils.functions.js";

async function addSongsToPlaylistModalOnConfirm(app: App, modal: CenterModal, searchResultContainerElement: HTMLElement, songsLeft: Song[]): Promise<ModalError> {
    const currentOpenedPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentOpenedPlaylist == null) {
        app.throwError("Can't add songs to playlist: Current opened playlist is null.");
        return null;
    }
    
    const liElements: HTMLElement[] = [...searchResultContainerElement.querySelectorAll<HTMLElement>("li")];
    const songIDsToAdd: ID[] = liElements.map((li: HTMLElement) => {
        const checkbox: HTMLInputElement | null = li.querySelector<HTMLInputElement>("input");
        const songID: number = Number(li.getAttribute("song-id"));

        if (!checkbox?.checked || isNaN(songID)) {
            return null;
        }

        return app.playlistManager.getSongFromID(songID);

    }).filter((song: Song | null) => song != null).map((song: Song) => song.id);

    const songWord: string = Functions.pluralize("song", songIDsToAdd.length);

    const addSongsToPlaylistReqRes: any = await Requests.song.addToPlaylist(app, songIDsToAdd, currentOpenedPlaylist.id);
    if (!addSongsToPlaylistReqRes.success) {
        app.throwError(`Can't add ${songWord} to playlist: ${addSongsToPlaylistReqRes.error}`);
        return null;
    }

    app.playlistManager.refreshPlaylistBuffer().then(() => {
        app.playlistManager.refreshPlaylistsContainerTab();
        app.playlistManager.refreshOpenedPlaylistTab();
    });

    app.modalManager.openTopModal("SUCCESS", `Successfully added ${songWord} to playlist "${currentOpenedPlaylist.name}".`);
    return null;
}

function addSongModalOnSearch(searchResultContainerElement: HTMLElement, query: string, songsLeft: Song[]): void {
    Functions.removeChildren(searchResultContainerElement);

    query = query.toLowerCase();

    songsLeft.forEach((song: Song) => {
        const titleIncludes: boolean = song.title.toLowerCase().includes(query);
        const artistIncludes: boolean = song.artist.toLowerCase().includes(query);

        if (!titleIncludes && !artistIncludes) {
            return;
        }

        const liElement: HTMLElement = document.createElement("li");
        liElement.classList.add("song-container");
        liElement.setAttribute("song-id", String(song.id));
        searchResultContainerElement.appendChild(liElement);

        const titleElement: HTMLElement = document.createElement("h2");
        titleElement.classList.add("song-title-and-artist");
        titleElement.classList.add("extern-text");
        titleElement.textContent = `${song.title} by ${song.artist}`;
        liElement.appendChild(titleElement);

        const checkboxElement: HTMLInputElement = document.createElement("input");
        checkboxElement.type = "checkbox";
        liElement.appendChild(checkboxElement);

        liElement.addEventListener("click", (e: PointerEvent) => {
            if (e.target != checkboxElement) {
                checkboxElement.checked = !checkboxElement.checked;
            }
        });
    });
}

export default function openAddSongsToPlaylistModal(app: App, songsLeft: Song[]): void {
    const currentOpenedPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentOpenedPlaylist == null) {
        return app.throwError("Can't open add songs to playlist modal: Current opened playlist is null.");
    }

    const data: CenterSearchModalData = {
        title: `Add song to ${currentOpenedPlaylist.name}`,
        onConfirm: async (modal: CenterModal, searchResultContainerElement: HTMLElement) => await addSongsToPlaylistModalOnConfirm(app, modal, searchResultContainerElement, songsLeft),
        onSearch: async (searchResultContainerElement: HTMLElement, query: string) => addSongModalOnSearch(searchResultContainerElement, query, songsLeft),
        searchDelay: 200,
        instantSearch: true,
        cantClose: false,
    };

    app.modalManager.openCenterSearchModal(data);
}
