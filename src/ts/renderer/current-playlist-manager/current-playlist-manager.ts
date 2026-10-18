import Api from "./../utils/utils.api.js";
import Elements from "./../utils/utils.elements.js";
import Functions from "./../utils/utils.functions.js";
import { App } from "./../app.js";

export default class CurrentPlaylistManager {
    private static readonly openedClassName: string = "opened";

    private readonly elements = Elements.currentPlaylist;

    private _playlist: Playlist | null = null;

    // INIT
    public constructor(private readonly app: App) {}

    // LOAD
    private load(): void {
        this.elements.container.classList.remove("song-playlist", "merged-playlist");
        // this.elements.container.classList.add(this.playlist.type);

        Functions.Heko.setThumbnail(this.elements.details.thumbnail, this.playlist.thumbnailFileName);
        this.elements.details.title.textContent = this.playlist.name;
        this.elements.details.count.textContent = this.getCountText();
        this.elements.details.duration.textContent = this.getDurationText();

        this.elements.container.classList.add(CurrentPlaylistManager.openedClassName);
    }

    // OTHER
    private get playlist(): Playlist {
        if (this._playlist === null) {
            throw new Error(`Could not get playlist: playlist is null.`);
        }

        return this._playlist;
    }

    private getCountText(): string {
        return "";
    //     const songCount: number = this.playlist.songs.length;
    //     const songCountText = `${songCount} ${Functions.Strings.pluralize("song", "songs", songCount)}`;

    //     if (this.playlist.type === "song-playlist") {
    //         return songCountText;
    //     }

    //     if (this.playlist.type === "merged-playlist" && this.playlist.merged !== undefined) {
    //         const mergedCount: number = this.playlist.merged.length;
    //         return `${mergedCount} ${Functions.Strings.pluralize("playlist", "playlists", mergedCount)} ー ${songCountText}`;
    //     }

    //     throw new Error(`Could not get count text: Playlist with id = "${this.playlist.id}" is invalid.`);
    }

    private getDurationText(): string {
        return "";
    //     const duration: number = this.playlist.songs.reduce((acc: number, song: Song) => acc + song.duration, 0);
    //     return (duration !== 0) ? Functions.Time.formatSeconds(duration, 0, true, true) : "";
    }

    // PUBLIC
    public async open(id: ID): Promise<void> {
        // await this.close();

        // const getPlaylistReqRes: GetUserPlaylistApiResult = await Api.Playlists.get(id);
        // if (!getPlaylistReqRes.success) {
        //     throw new Error(getPlaylistReqRes.error);
        // }

        // this._playlist = getPlaylistReqRes.playlist;
        // this.load();
    }

    public async close(): Promise<void> {

    }
};
