import App from "./../app.js";
import ListenerManager from "./listener.js";
import * as Functions from "./../utils/utils.functions.js";
import * as Elements from "./../utils/utils.elements.js";

export default class ListenerRefreshManager {
    constructor(private app: App, private main: ListenerManager) {

    }

    public songLoop(): void {
        const currentSong: Song | null = this.main.getCurrentSong();
        const audioElement: HTMLAudioElement = this.main.getAudioElement();

        const positionText: string = ((currentSong == null) ? "\u00A0" : Functions.formatDuration(audioElement.currentTime));
        Elements.songControls.progressBar.position.textContent = positionText;

        const durationText: string = ((currentSong == null) ? "\u00A0" : Functions.formatDuration(currentSong!.duration));
        Elements.songControls.progressBar.duration.textContent = durationText;

        const sliderValue: string = ((currentSong == null) ? "0" : String(audioElement.currentTime / currentSong.duration * 100));
        Elements.songControls.progressBar.slider.value = sliderValue;
    }

    public refresh(currentSong: Song | null): void {
        this.refreshDetails(currentSong);
        this.refreshSongClasses(currentSong);
        this.refreshQueue(currentSong);
    }

    private refreshDetails(currentSong: Song | null): void {
        Elements.currentSong.title.textContent = (currentSong?.title ?? "");
        Elements.currentSong.artist.textContent = (currentSong?.artist ?? "");
    }

    private refreshSongClasses(currentSong: Song | null): void {
        const currentListeningPlaylist: Playlist | null = this.main.getCurrentListeningPlaylist();
        if (currentListeningPlaylist == null || currentSong == null) {
            return;
        }

        [...Elements.currentPlaylist.song.container.querySelectorAll("li")].forEach((li: Element) => li.classList.remove("listening"));

        const currentSongLi: Element | undefined = [...Elements.currentPlaylist.song.container.querySelectorAll("li")].find((li: Element) => {
            const liPlaylistID: number = (li.hasAttribute("playlist-id") ? Number(li.getAttribute("playlist-id")) : -1);
            const liSongID: number = (li.hasAttribute("song-id") ? Number(li.getAttribute("song-id")) : -1);

            return (liPlaylistID == currentListeningPlaylist.id && liSongID == currentSong.id);
        });

        if (currentSongLi == undefined) {
            return;
        }

        currentSongLi.classList.add("listening");
    }

    private refreshQueue(currentSong: Song | null): void {
        const queue: Queue = this.main.getQueue();
        const queueButton: HTMLElement = Elements.queue.button;

        Functions.removeChildren(Elements.queue.currentSongContainer);
        Functions.removeChildren(Elements.queue.nextSongsContainer);

        const canOpenQueue: boolean = (queue.length != 0);
        (canOpenQueue)
            ? queueButton.classList.remove("disabled")
            : queueButton.classList.add("disabled");

        if (!canOpenQueue || currentSong == null) {
            document.querySelector("queue-container")?.classList.add("hidden");
            return;
        }

        const createSongContainer = (parent: HTMLElement, song: Song): void => {
            const container: HTMLElement = document.createElement("li");
            container.classList.add("queue-song");
            parent.appendChild(container);

            const titleElement: HTMLElement = document.createElement("h3");
            titleElement.classList.add("text-overflow");
            titleElement.textContent = song.title;
            container.appendChild(titleElement);

            const artistElement: HTMLElement = document.createElement("h4");
            artistElement.classList.add("text-overflow");
            artistElement.textContent = song.artist;
            container.appendChild(artistElement);

            const optionsButton: HTMLElement = document.createElement("button");
            container.appendChild(optionsButton);

            const optionsButtonImg: HTMLImageElement = document.createElement("img");
            optionsButtonImg.src = "assets/ellipsis.svg";
            optionsButton.appendChild(optionsButtonImg);

            optionsButton.addEventListener("click", () => {
                const optionsButtonRect: DOMRect = optionsButton.getBoundingClientRect();
                this.app.contextmenuManager.createSongContextMenu({ x: optionsButtonRect.x, y: optionsButtonRect.y }, song, optionsButton);
            });
        };

        createSongContainer(Elements.queue.currentSongContainer, currentSong);
        queue.slice(0, 20).forEach((song: Song) => createSongContainer(Elements.queue.nextSongsContainer, song));
    }
};
