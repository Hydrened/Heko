import App from "./../../app.js";
import CenterModal from "./../modal.center.js";
import CenterSearchModal from "./../modal.center.search.js";
import LoadingModal from "../modal.loading.js";
import openAddSongFileToAppModal from "./add-song-file-to-app.js";
import * as Bridge from "./../../utils/utils.bridge.js";
import * as Requests from "./../../utils/utils.requests.js";
import * as Functions from "./../../utils/utils.functions.js";

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

function createVideoElement(app: App, userSongs: Song[], searchResultContainerElement: HTMLElement, video: Video): void {
    if (video.id.kind != "youtube#video") {
        return;
    }

    if (video.id.videoId == undefined) {
        return;
    }

    createContainers(app, userSongs, searchResultContainerElement, video);
}

function createContainers(app: App, userSongs: Song[], mainContainer: HTMLElement, video: Video): void {
    const videoContainerElement: HTMLElement = document.createElement("li");
    videoContainerElement.classList.add("video-container-element");
    mainContainer.appendChild(videoContainerElement);

    const thumbnailElement: HTMLElement = document.createElement("div");
    thumbnailElement.classList.add("thumbnail");
    videoContainerElement.appendChild(thumbnailElement);

    const thumbnail: VideoThumbnail | undefined = video.snippet.thumbnails.high;
    if (thumbnail != undefined) {
        Functions.setThumbnail(thumbnailElement, thumbnail.url, true);
    }

    const detailContainerElement: HTMLElement = document.createElement("div");
    detailContainerElement.classList.add("video-detail-container");
    videoContainerElement.appendChild(detailContainerElement);

    createDetailContainerContent(app, userSongs, detailContainerElement, video);
}

function createDetailContainerContent(app: App, userSongs: Song[], container: HTMLElement, video: Video): void {
    const titleElement: HTMLElement = document.createElement("h1");
    titleElement.classList.add("video-title");
    titleElement.textContent = Functions.decodeNumericEntities(video.snippet.title);
    container.appendChild(titleElement);

    const channelElement: HTMLElement = document.createElement("h2");
    channelElement.classList.add("video-channel");
    channelElement.textContent = Functions.decodeNumericEntities(video.snippet.channelTitle);
    container.appendChild(channelElement);

    const voidElement: HTMLElement = document.createElement("div");
    container.appendChild(voidElement);

    const downloadSongButton: HTMLElement = document.createElement("button");
    downloadSongButton.textContent = "Download";
    container.appendChild(downloadSongButton);

    downloadSongButton.addEventListener("click", async () => await downloadSongButtonOnClick(app, userSongs, video));
}

async function downloadSongButtonOnClick(app: App, userSongs: Song[], video: Video): Promise<void> {
    const downloadSongReqRes: any = await LoadingModal.create<any>("", Bridge.youtube.downloadSong(video.id.videoId!, (data: string) => LoadingModal.setTitle(data)));
    if (!downloadSongReqRes.success) {
        return app.throwError(`Can't download song from youtube: ${downloadSongReqRes.error}`);
    }

    const buffer: Uint8Array = (downloadSongReqRes.buffer as Uint8Array);
    const file: File = new File([new Uint8Array(buffer)], `${Functions.decodeNumericEntities(video.snippet.title)}.mp3`, { type: "audio/mpeg" });

    openAddSongFileToAppModal(app, userSongs);
    const songFileInput: HTMLInputElement | null = CenterModal.getFieldInput("Song file");
    if (songFileInput == null) {
        return app.throwError("Can't set file in song file input: Input is null.");
    }

    const dataTransfer: DataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    songFileInput.files = dataTransfer.files;
    songFileInput.dispatchEvent(new Event("change"));
}

export default function openAddYoutubeSongToAppModal(app: App, userSongs: Song[]): void {
    const data: CenterSearchModalData = {
        title: "Search song on Youtube",
        onConfirm: async (modal: CenterModal) => null,
        onSearch: async (searchResultContainerElement: HTMLElement, query: string) => await addYoutubeSongToAppModalOnSearch(app, userSongs, searchResultContainerElement, query),
        cantClose: false,
    };

    new CenterSearchModal(app, data);
}
