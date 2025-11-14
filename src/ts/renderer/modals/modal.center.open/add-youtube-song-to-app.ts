import App from "./../../app.js";
import openAddSongFileToAppModal from "./add-song-file-to-app.js";
import * as Bridge from "./../../utils/utils.bridge.js";
import * as Requests from "./../../utils/utils.requests.js";
import * as Functions from "./../../utils/utils.functions.js";
import * as AntiSpam from "./../../utils/utils.anti-spam.js";

// SEARCH
async function addYoutubeSongToAppModalOnSearch(app: App, userSongs: Song[], searchResultContainerElement: HTMLElement, query: string): Promise<void> {
    const encodedQuery: string = encodeURIComponent(query);

    Functions.removeChildren(searchResultContainerElement);
    searchResultContainerElement.classList.add("loading");

    const searchReqRes: any = await Requests.youtube.search(app, encodedQuery);
    if (!searchReqRes.success) {
        return app.throwError(`Can't search on youtube: ${searchReqRes.error}`);
    }

    searchResultContainerElement.classList.remove("loading");

    const videos: Video[] = (searchReqRes.videos as Video[]);
    videos.forEach((video: Video) => createVideoElement(app, userSongs, searchResultContainerElement, video));
}

// CREATE
function createVideoElement(app: App, userSongs: Song[], searchResultContainerElement: HTMLElement, video: Video): void {
    if (video.id.kind != "youtube#video") {
        return;
    }

    if (video.id.videoId == undefined) {
        return;
    }

    const elements: any = [];

    createMainContainers(app, elements, searchResultContainerElement, video);
    initEvents(app, elements, userSongs, video);
}

function createMainContainers(app: App, elements: any, mainContainer: HTMLElement, video: Video): void {
    const videoContainerElement: HTMLElement = document.createElement("li");
    videoContainerElement.classList.add("video-container");
    mainContainer.appendChild(videoContainerElement);
    elements.container = videoContainerElement;

    const thumbnailElement: HTMLElement = document.createElement("div");
    thumbnailElement.classList.add("thumbnail");
    videoContainerElement.appendChild(thumbnailElement);
    elements.thumbnail = thumbnailElement;

    const thumbnail: VideoThumbnail | undefined = video.snippet.thumbnails.high;
    if (thumbnail != undefined) {
        Functions.setThumbnail(thumbnailElement, thumbnail.url, true);
    }

    const detailContainerElement: HTMLElement = document.createElement("div");
    detailContainerElement.classList.add("video-detail-container");
    videoContainerElement.appendChild(detailContainerElement);
    elements.details = { container: detailContainerElement };
    createDetailContainerContent(app, elements, video);

    const songPlayerContainerElement: HTMLElement = document.createElement("footer");
    songPlayerContainerElement.classList.add("song-player-container");
    songPlayerContainerElement.classList.add("hidden");
    videoContainerElement.appendChild(songPlayerContainerElement);
    elements.player = { container: songPlayerContainerElement };
    createSongPlayerContainerContent(app, elements);
}

function createDetailContainerContent(app: App, elements: any, video: Video): void {
    const container: HTMLElement = elements.details.container;

    const titleElement: HTMLElement = document.createElement("h1");
    titleElement.classList.add("video-title");
    titleElement.textContent = Functions.decodeNumericEntities(video.snippet.title);
    elements.details.title = titleElement;
    container.appendChild(titleElement);

    const channelElement: HTMLElement = document.createElement("h2");
    channelElement.classList.add("video-channel");
    channelElement.textContent = Functions.decodeNumericEntities(video.snippet.channelTitle);
    elements.details.channel = titleElement;
    container.appendChild(channelElement);

    const voidElement: HTMLElement = document.createElement("div");
    container.appendChild(voidElement);

    const downloadSongButton: HTMLElement = document.createElement("button");
    downloadSongButton.textContent = "Download";
    downloadSongButton.setAttribute("tabindex", String(-1));
    elements.details.downloadButton = downloadSongButton;
    container.appendChild(downloadSongButton);
}

function createSongPlayerContainerContent(app: App, elements: any): void {
    const container: HTMLElement = elements.player.container;

    const playButtonElement: HTMLElement = document.createElement("button");
    elements.player.playButton = playButtonElement;
    container.appendChild(playButtonElement);

    const buttonPlayImgElement: HTMLImageElement = document.createElement("img");
    buttonPlayImgElement.setAttribute("playing", String(false));
    buttonPlayImgElement.src = "assets/window-play.png";
    playButtonElement.appendChild(buttonPlayImgElement);

    const buttonPauseImgElement: HTMLImageElement = document.createElement("img");
    buttonPauseImgElement.setAttribute("playing", String(true));
    buttonPauseImgElement.src = "assets/window-pause.png";
    playButtonElement.appendChild(buttonPauseImgElement);

    const timeContainerElement: HTMLElement = document.createElement("p");
    container.appendChild(timeContainerElement);

    const currentTimeElement: HTMLElement = document.createElement("span");
    currentTimeElement.textContent = "0:00";
    elements.player.currentTime = currentTimeElement;
    timeContainerElement.appendChild(currentTimeElement);

    const timeSeparatorElement: HTMLElement = document.createElement("span");
    timeSeparatorElement.textContent = "/";
    timeContainerElement.appendChild(timeSeparatorElement);

    const durationElement: HTMLElement = document.createElement("span");
    durationElement.textContent = "--:--";
    elements.player.duration = durationElement;
    timeContainerElement.appendChild(durationElement);

    const sliderElement: HTMLInputElement = document.createElement("input");
    sliderElement.setAttribute("tabindex", String(-1));
    sliderElement.type = "range";
    sliderElement.min = String(0);
    sliderElement.max = String(100);
    sliderElement.step = String(0.01);
    sliderElement.value = String(0);
    elements.player.slider = sliderElement;
    container.appendChild(sliderElement);
}

// EVENTS
function initEvents(app: App, elements: any, userSongs: Song[], video: Video): void {
    elements.thumbnail.addEventListener("click", () => thumbnailOnClick(app, elements, video), { once: true });

    elements.details.downloadButton.addEventListener("click", async () => await AntiSpam.prevent(downloadSongButtonOnClick(app, userSongs, video)));

    elements.player.playButton.addEventListener("click", () => playButtonOnClick(app, elements));

    elements.player.slider.addEventListener("input", () => sliderOnInput(app, elements));
}

async function downloadSongButtonOnClick(app: App, userSongs: Song[], video: Video): Promise<void> {
    const updateLoadingModalTitle = (data: string): void => {
        app.modalManager.getCurrentLoadingModal()?.setTitle(data);
    };

    const downloadSongReqRes: any = await app.modalManager.openLoadingModal("", Bridge.youtube.downloadSong(video.id.videoId!, updateLoadingModalTitle));
    if (!downloadSongReqRes.success) {
        return app.throwError(`Can't download song from youtube: ${downloadSongReqRes.error}`);
    }

    // const addUserDownloadReqRes: any = await Requests.user.addDownload(app, video.id.videoId!);
    // if (!addUserDownloadReqRes.success) {
    //     return app.throwError(`Can't add user download: ${addUserDownloadReqRes.error}`);
    // }

    const buffer: Uint8Array = (downloadSongReqRes.buffer as Uint8Array);
    const file: File = new File([new Uint8Array(buffer)], `${Functions.decodeNumericEntities(video.snippet.title)}.mp3`, { type: "audio/mpeg" });

    openAddSongFileToAppModal(app, userSongs);

    const currentCenterModal: CenterModal | null = app.modalManager.getCurrentCenterModal();
    if (currentCenterModal == null) {
        return app.throwError("Can't fill song details: Current center modal is null.");
    }

    const songTitleInput: HTMLInputElement | null = currentCenterModal.getFieldInput("Title");
    if (songTitleInput == null) {
        return app.throwError("Can't set song title: Input is null.");
    }
    songTitleInput.value = video.snippet.title!;

    const songArtistInput: HTMLInputElement | null = currentCenterModal.getFieldInput("Artist");
    if (songArtistInput == null) {
        return app.throwError("Can't set song artist: Input is null.");
    }
    songArtistInput.value = video.snippet.channelTitle!;

    const songFileInput: HTMLInputElement | null = currentCenterModal.getFieldInput("Song file");
    if (songFileInput == null) {
        return app.throwError("Can't set file in song file input: Input is null.");
    }

    const dataTransfer: DataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    songFileInput.files = dataTransfer.files;
    songFileInput.dispatchEvent(new Event("change"));
    songFileInput.setAttribute("disabled", String(true));
}

async function thumbnailOnClick(app: App, elements: any, video: Video): Promise<void> {
    const mainContainer: HTMLElement = elements.container;
    const songPlayerContainer: HTMLElement = elements.player.container;
    const durationElement: HTMLElement = elements.player.duration;

    mainContainer.classList.add("loading");

    const getYoutubeSongSrcReqRes: any = await Bridge.youtube.getSongSrc(video.id.videoId!);
    if (!getYoutubeSongSrcReqRes.success) {
        mainContainer.classList.remove("loading");
        return app.throwError(`Can't get youtube song src: ${getYoutubeSongSrcReqRes.error}`);
    }

    const src: string = (getYoutubeSongSrcReqRes.src as string);

    const audioElement: HTMLAudioElement = new Audio(src);
    audioElement.volume = (app.listenerManager.getVolume() * 0.01);
    elements.player.audio = audioElement;
    songPlayerContainer.appendChild(audioElement);
    
    audioElement.addEventListener("loadedmetadata", () => {
        mainContainer.classList.remove("loading");
        songPlayerContainer.classList.remove("hidden");
        durationElement.textContent = String(Functions.formatDuration(audioElement.duration));

        elements.player.playButton.dispatchEvent(new Event("click"));
    });

    audioElement.addEventListener("ended", () => {
        elements.player.playButton.setAttribute("playing", String(false));
    });

    audioElement.addEventListener("timeupdate", () => {
        const progress: number = ((audioElement.currentTime / audioElement.duration) * 100);

        elements.player.currentTime.textContent = Functions.formatDuration(audioElement.currentTime);
        elements.player.slider.value = progress;
    });
}

function playButtonOnClick(app: App, elements: any): void {
    const playButtonElement: HTMLElement = elements.player.playButton;
    const audioElement: HTMLAudioElement = elements.player.audio;

    if (!app.listenerManager.getAudioElement().paused) {
        app.listenerManager.togglePlayButton();
    }

    if (audioElement.paused) {
        audioElement.play();
        playButtonElement.setAttribute("playing", String(true));
    }
    else {
        audioElement.pause();
        playButtonElement.setAttribute("playing", String(false));   
    }
}

function sliderOnInput(app: App, elements: any): void {
    const audioElement: HTMLAudioElement = elements.player.audio;
    
    const value: number = elements.player.slider.value;
    const currentTime: number = (audioElement.duration * value * 0.01);

    audioElement.currentTime = currentTime;
}

// OPEN MODAL
export default function openAddYoutubeSongToAppModal(app: App, userSongs: Song[]): void {
    const data: CenterSearchModalData = {
        title: "Search song on Youtube",
        onConfirm: async (modal: CenterModal, searchResultContainerElement: HTMLElement) => null,
        onSearch: async (searchResultContainerElement: HTMLElement, query: string) => await addYoutubeSongToAppModalOnSearch(app, userSongs, searchResultContainerElement, query),
        searchDelay: 1000,
        instantSearch: false,
        cantClose: false,
    };

    app.modalManager.openCenterSearchModal(data);
}
