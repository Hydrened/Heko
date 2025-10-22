import ListenerManager from "./listener.js";
import App from "./../app.js";
import * as Resquests from "./../utils/utils.requests.js";

export default class ListenerQueueManager {
    private queue: Queue = [];
    private currentQueueIndex = 0;
    private historySize = 0;

    private currentPlaylist: Playlist | null = null;
    private currentSongs: Song[] | null = null;

    constructor(private app: App, private listener: ListenerManager) {
        
    }

    public async init(playlist: Playlist): Promise<void> {
        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return this.app.throwError("Can't init queue: User is not logged in.");
        }

        this.currentPlaylist = structuredClone(playlist);

        const getSongsFromPlaylistReqRes: any = await Resquests.song.getFromPlaylist(userData.id, userData.token, this.currentPlaylist.id);
        if (!getSongsFromPlaylistReqRes.success) {
            return this.app.throwError(`Caan't init queue: ${getSongsFromPlaylistReqRes.error}`);
        }

        this.currentSongs = (getSongsFromPlaylistReqRes.songs as Song[]);

        this.recreate();
    }

    private recreate(): void {
        if (this.currentSongs == null) {
            return this.app.throwError("Can't refresh queue: Songs are null.");
        }

        const loop: boolean = this.listener.getLoopState();
        if (loop) {
            this.queue = this.currentSongs.map(() => this.currentSongs![0]);
            return;
        }

        const shuffle: boolean = this.listener.getShuffleState();
        if (shuffle) {

        }
        else {
            this.queue = this.currentSongs;
        }

        console.log(this.queue);
    }

    public getCurrentPlaylist(): Playlist | null {
        return this.currentPlaylist;
    }
};
