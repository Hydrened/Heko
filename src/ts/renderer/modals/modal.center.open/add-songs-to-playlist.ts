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

function addSongModalOnSearch(app: App, audioELement: HTMLAudioElement, searchResultContainerElement: HTMLElement, query: string, songsLeft: Song[]): void {
    Functions.removeChildren(searchResultContainerElement);
    query = query.toLowerCase();
    songsLeft.forEach((song: Song) => createSongContainer(app, audioELement, searchResultContainerElement, query, song));
}

function createSongContainer(app: App, audioELement: HTMLAudioElement, searchResultContainerElement: HTMLElement, query: string, song: Song): void {
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

    const togglePlayButton: HTMLElement = document.createElement("button");
    togglePlayButton.setAttribute("playing", String(false));
    togglePlayButton.setAttribute("tabindex", String(-1));
    liElement.appendChild(togglePlayButton);

    const togglePlayButtonPlayImg: HTMLImageElement = document.createElement("img");
    togglePlayButtonPlayImg.setAttribute("playing", String(false));
    togglePlayButtonPlayImg.src = "assets/window-play.png";
    togglePlayButton.appendChild(togglePlayButtonPlayImg);

    const togglePlayButtonPauseImg: HTMLImageElement = document.createElement("img");
    togglePlayButtonPauseImg.setAttribute("playing", String(true));
    togglePlayButtonPauseImg.src = "assets/window-pause.png";
    togglePlayButton.appendChild(togglePlayButtonPauseImg);

    const checkboxElement: HTMLInputElement = document.createElement("input");
    checkboxElement.setAttribute("tabindex", String(-1));
    checkboxElement.type = "checkbox";
    liElement.appendChild(checkboxElement);

    liElement.addEventListener("click", (e: PointerEvent) => {
        if (e.target == null) {
            return;
        }

        if (![togglePlayButton, togglePlayButtonPlayImg, togglePlayButtonPauseImg, checkboxElement].includes((e.target as HTMLElement))) {
            checkboxElement.checked = !checkboxElement.checked;
        }
    });

    togglePlayButton.addEventListener("click", () => togglePlayButtonOnClick(app, searchResultContainerElement, audioELement, liElement, togglePlayButton, song));

    liElement.addEventListener("contextmenu", (e: PointerEvent) => app.contextmenuManager.createSongContextMenu((e as Position), song, liElement));
}

function togglePlayButtonOnClick(app: App, searchResultContainerElement: HTMLElement, audioELement: HTMLAudioElement, songContainer: HTMLElement, togglePlayButton: HTMLElement, song: Song): void {
    if (!togglePlayButton.hasAttribute("playing")) {
        return app.throwError("Can't toggle play state: Play button element has no playing attribute.");
    }

    const songSrc: string = Functions.getSongPath(song);
    if (audioELement.src != songSrc) {
        songContainer.classList.add("loading");

        audioELement.src = songSrc;
        audioELement.currentTime = (song.duration * 0.23);

        resetEverySong(app, searchResultContainerElement);

        if (!app.listenerManager.getAudioElement().paused) {
            app.listenerManager.togglePlayButton();
        }
    }

    const playing: boolean = (togglePlayButton.getAttribute("playing") == "true");
    togglePlayButton.setAttribute("playing", String(!playing));

    if (!playing) {
        audioELement.play().then(() => songContainer.classList.remove("loading"));
    }
    else {
        audioELement.pause();
    }
}

function resetEverySong(app: App, searchResultContainerElement: HTMLElement): void {
    const playButtonElements: HTMLElement[] = [...searchResultContainerElement.querySelectorAll<HTMLElement>("button")];
    playButtonElements.forEach((button: HTMLElement) => button.setAttribute("playing", String(false)));
}

export default function openAddSongsToPlaylistModal(app: App, songsLeft: Song[]): void {
    const currentOpenedPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentOpenedPlaylist == null) {
        return app.throwError("Can't open add songs to playlist modal: Current opened playlist is null.");
    }

    const audioELement: HTMLAudioElement = new Audio();
    audioELement.volume = (app.listenerManager.getVolume() * 0.01);
    
    const data: CenterSearchModalData = {
        title: `Add song to ${currentOpenedPlaylist.name}`,
        onConfirm: async (modal: CenterModal, searchResultContainerElement: HTMLElement) => await addSongsToPlaylistModalOnConfirm(app, modal, searchResultContainerElement, songsLeft),
        onSearch: async (searchResultContainerElement: HTMLElement, query: string) => addSongModalOnSearch(app, audioELement, searchResultContainerElement, query, songsLeft),
        onClose: () => {
            audioELement.pause();
            audioELement.src = "";
            audioELement.load();
            audioELement.remove();
        },
        searchDelay: 200,
        instantSearch: true,
        cantClose: false,
    };

    app.modalManager.openCenterSearchModal(data);
}
