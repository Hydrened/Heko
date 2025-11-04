import App from "./../../app.js";
import CenterModal from "./../modal.center.js";
import CenterSearchModal from "./../modal.center.search.js";
import * as Requests from "./../../utils/utils.requests.js";
import * as Functions from "./../../utils/utils.functions.js";

async function addYoutubeSongToAppModalOnConfirm(app: App, userSongs: Song[], modal: CenterModal): Promise<ModalError> {
    return null;
}

async function addYoutubeSongToAppModalOnSearch(app: App, searchResultContainerElement: HTMLElement, query: string): Promise<void> {
    const encodedQuery: string = encodeURIComponent(query);

    Functions.removeChildren(searchResultContainerElement);
    searchResultContainerElement.classList.add("loading");

    const searchReqRes: any = await Requests.youtube.search(app, encodedQuery);
    if (!searchReqRes.success) {
        return app.throwError(`Can't search on youtube: ${searchReqRes.error}`);
    }

    searchResultContainerElement.classList.remove("loading");

    const videos: Video[] = (searchReqRes.videos as Video[]);
    videos.forEach((video: Video) => createVideoElement(app, searchResultContainerElement, video));
}

function createVideoElement(app: App, searchResultContainerElement: HTMLElement, video: Video): void {
    if (video.id.kind != "youtube#video") {
        return;
    }

    const videoContainerElement: HTMLElement = document.createElement("li");
    videoContainerElement.classList.add("video-container-element");
    searchResultContainerElement.appendChild(videoContainerElement);

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

    const titleElement: HTMLElement = document.createElement("h1");
    titleElement.classList.add("video-title");
    titleElement.textContent = Functions.decodeNumericEntities(video.snippet.title);
    detailContainerElement.appendChild(titleElement);

    const channelElement: HTMLElement = document.createElement("h2");
    channelElement.classList.add("video-channel");
    channelElement.textContent = Functions.decodeNumericEntities(video.snippet.channelTitle);
    detailContainerElement.appendChild(channelElement);

    const buttonContainerElement: HTMLElement = document.createElement("footer");
    buttonContainerElement.classList.add("video-button-container");
    detailContainerElement.appendChild(buttonContainerElement);

    const downloadSongButton: HTMLElement = document.createElement("button");
    downloadSongButton.textContent = "Download";
    buttonContainerElement.appendChild(downloadSongButton);

    const videoID: string | undefined = video.id.videoId;
    if (videoID != undefined) {

    }
}

export default function openAddYoutubeSongToAppModal(app: App, userSongs: Song[]): void {
    const data: CenterSearchModalData = {
        title: "Search song on Youtube",
        onConfirm: async (modal: CenterModal) => await addYoutubeSongToAppModalOnConfirm(app, userSongs, modal),
        onSearch: async (searchResultContainerElement: HTMLElement, query: string) => await addYoutubeSongToAppModalOnSearch(app, searchResultContainerElement, query),
        cantClose: false,
    };

    new CenterSearchModal(app, data);
}
