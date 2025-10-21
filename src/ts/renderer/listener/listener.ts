import App from "./../app.js";
import ListenerRefreshManager from "./listener.refresh.js";
import ListenerQueueManager from "./listener.queue.js";
import ListenerVolumeManager from "./listener.volume.js";
import ListenerEditManager from "./listener.edit.js";

export default class ListenerManager {
    private listenerRefreshManager: ListenerRefreshManager;
    private listenerQueueManager: ListenerQueueManager;
    private listenerVolumeManager: ListenerVolumeManager;
    private listenerEditManager: ListenerEditManager;

    public currentSong: Song | null = {
        id: 0,
        playlistID: 4,
        fileName: "slack.mp3",
        title: "title",
        artist: "artist",
        duration: 156,
        creationDate: "",
    };
    // public currentSong: Song | null = null;

    constructor(private app: App) {
        this.listenerRefreshManager = new ListenerRefreshManager(this.app, this);
        this.listenerQueueManager = new ListenerQueueManager(this.app, this);
        this.listenerVolumeManager = new ListenerVolumeManager(this.app, this);
        this.listenerEditManager = new ListenerEditManager(this.app, this);
    }

    public refresh(): void {
        // this.listenerRefreshManager.refresh();
    }
};
