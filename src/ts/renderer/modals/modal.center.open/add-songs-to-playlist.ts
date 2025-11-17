import App from "./../../app.js";
import CenterSearchModal from "./../modal.center.search.js";
import * as Requests from "./../../utils/utils.requests.js";
import * as Functions from "./../../utils/utils.functions.js";

function modalOnCreate(app: App, audioELement: HTMLAudioElement, songsLeft: Song[], container: HTMLElement): void {
    songsLeft.forEach((song: Song) => createSongContainer(app, audioELement, container, "", song));
}

function createSongContainer(app: App, audioELement: HTMLAudioElement, container: HTMLElement, query: string, song: Song): void {
    const liElement: HTMLElement = CenterSearchModal.createCheckboxRow(`${song.title} by ${song.artist}`);
    liElement.classList.add("song-container");
    liElement.setAttribute("song-id", String(song.id));
    container.appendChild(liElement);

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

    togglePlayButton.addEventListener("click", () => togglePlayButtonOnClick(app, container, audioELement, liElement, togglePlayButton, song));

    liElement.addEventListener("contextmenu", (e: PointerEvent) => app.contextmenuManager.createSongContextMenu((e as Position), song, liElement));
}

function togglePlayButtonOnClick(app: App, container: HTMLElement, audioELement: HTMLAudioElement, songContainer: HTMLElement, togglePlayButton: HTMLElement, song: Song): void {
    if (!togglePlayButton.hasAttribute("playing")) {
        return app.throwError("Can't toggle play state: Play button element has no playing attribute.");
    }

    const songSrc: string = Functions.getSongPath(song);
    if (audioELement.src != songSrc) {
        songContainer.classList.add("loading");

        audioELement.src = songSrc;
        audioELement.currentTime = (song.duration * 0.23);

        resetEverySong(app, container);

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

function resetEverySong(app: App, container: HTMLElement): void {
    const playButtonElements: HTMLElement[] = [...container.querySelectorAll<HTMLElement>("button")];
    playButtonElements.forEach((button: HTMLElement) => button.setAttribute("playing", String(false)));
}

async function modalOnConfirm(app: App, modal: CenterModal, container: HTMLElement, songsLeft: Song[]): Promise<ModalError> {
    const currentOpenedPlaylist: Playlist | null = app.playlistManager.getCurrentOpenedPlaylist();
    if (currentOpenedPlaylist == null) {
        app.throwError("Can't add songs to playlist: Current opened playlist is null.");
        return null;
    }

    const songIDsToAdd: ID[] = (modal as CenterSearchModal).getCheckedElements().map((li: HTMLElement) => {
        return (app.playlistManager.getSongFromElement(li));
    }).filter((song: Song | null) => song != null).map((song: Song) => song.id).filter((songID: ID) => !currentOpenedPlaylist.songs.find((s) => s.id == songID));

    const songWord: string = Functions.pluralize("song", songIDsToAdd.length);

    if (songIDsToAdd.length == 0) {
        return {
            error: "Song(s) are already in this playlist.",
        };
    }

    const addSongsToPlaylistReqRes: any = await Requests.song.addToPlaylist(app, songIDsToAdd, [currentOpenedPlaylist.id]);
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

function modalOnSearch(app: App, audioELement: HTMLAudioElement, container: HTMLElement, query: string, songsLeft: Song[]): void {
    query = query.toLowerCase();

    const songElements: HTMLElement[] = [...container.querySelectorAll<HTMLElement>("li")];
    songElements.forEach((songElement: HTMLElement) => {
        const song: Song | null = app.playlistManager.getSongFromElement(songElement);
        if (song == null) {
            return app.throwError("Can't get song from element: Song is null.");
        }

        const titleIncludes: boolean = song.title.toLowerCase().includes(query);
        const artistIncludes: boolean = song.artist.toLowerCase().includes(query);
        const hidden: boolean = (!titleIncludes && !artistIncludes);

        songElement.classList.remove("hidden");
        if (hidden) {
            songElement.classList.add("hidden");
        }
    });
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
        onCreate: (container: HTMLElement) => modalOnCreate(app, audioELement, songsLeft, container),
        onConfirm: async (modal: CenterModal, container: HTMLElement) => await modalOnConfirm(app, modal, container, songsLeft),
        onSearch: async (container: HTMLElement, query: string) => modalOnSearch(app, audioELement, container, query, songsLeft),
        onClose: () => {
            audioELement.pause();
            audioELement.src = "";
            audioELement.load();
            audioELement.remove();
        },
        searchDelay: 200,
        cantClose: false,
    };

    app.modalManager.openCenterSearchModal(data);
}
