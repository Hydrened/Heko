import PlaylistManager from "./playlists.js";
import App from "./../app.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Elements from "./../utils/utils.elements.js";
import * as Functions from "./../utils/utils.functions.js";

export default class PlaylistsRefreshManager {
    constructor(private app: App, private playlists: PlaylistManager) {

    }

    public async refresh(): Promise<void> {
        await this.refreshPlaylistContainer();
        await this.refreshAddSongToPlaylistButton();
    }

    private async refreshPlaylistContainer(): Promise<void> {
        Functions.removeChildren(Elements.playlists.container);
        
        const playlists: Playlist[] = await this.getSortedPlaylists();
        
        playlists.forEach((playlist: Playlist) => this.createPlaylist(playlist));

        if (Elements.playlists.container == null) {
            return this.app.throwError("Can't refresh playlists: Playlist container element is null.");
        }

        [...Elements.playlists.container.children].forEach((liElement: Element, index: number) => {
            liElement.classList.add("spawn");

            setTimeout(() => {
                if (liElement != null) {
                    liElement.classList.remove("spawn");
                }
            }, (index + 1) * 50);
        });
    }

    public async refreshAddSongToPlaylistButton(): Promise<void> {
        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return;
        }

        if (Elements.currentPlaylist.addSongsButton == null) {
            return this.app.throwError("Can't refresh add song to playlist button: Add song to playlist modal button is null.");
        }

        const currentPlaylist: Playlist | null = this.app.playlistManager.getCurrentOpenedPlaylist();
        if (currentPlaylist == null) {
            return;
        }

        const getSongsFromPlaylistReqRes: any = await Requests.song.getFromPlaylist(userData.id, userData.token, currentPlaylist.id);
        if (!getSongsFromPlaylistReqRes.success) {
            return this.app.throwError(`Can't get songs from playlist: ${getSongsFromPlaylistReqRes.error}`);
        }

        const getAllSongsFromUserReqRes: any = await Requests.song.getAllFromUser(userData.id, userData.token);
        if (!getAllSongsFromUserReqRes.success) {
            return this.app.throwError(`Can't get songs from user: ${getAllSongsFromUserReqRes.error}`);
        }

        const playlistSongIDs: number[] = (getSongsFromPlaylistReqRes.songs as Song[]).map((song: Song) => song.id);
        const everyUserSongIDs: number[] = (getAllSongsFromUserReqRes.songs as Song[]).map((song: Song) => song.id);

        const canUserAddSongs: boolean = everyUserSongIDs.some((id: ID) => !playlistSongIDs.includes(id));
        (canUserAddSongs) ? Elements.currentPlaylist.addSongsButton.classList.remove("disabled") : Elements.currentPlaylist.addSongsButton.classList.add("disabled");
    }

    public async getSortedPlaylists(): Promise<Playlist[]> {
        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return [];
        }

        const getAllPlaylistsFromUserReqRes: any = await Requests.playlist.getAllFromUser(userData.id, userData.token);
        if (!getAllPlaylistsFromUserReqRes.success) {
            this.app.throwError(`Can't get playlists from user: ${getAllPlaylistsFromUserReqRes.error}`);
            return [];
        }

        const playlists: Playlist[] = (getAllPlaylistsFromUserReqRes.playlists as Playlist[]);

        const playlistsByParent: Map<number, Playlist[]> = new Map<number, Playlist[]>();

        for (const playlist of playlists) {
            if (!playlistsByParent.has(playlist.parentID)) {
                playlistsByParent.set(playlist.parentID, []);
            }

            playlistsByParent.get(playlist.parentID)!.push(playlist);
        }

        const res: Playlist[] = [];

        const addWithChildren = (parentID: number): void => {
            const playlistGroup: Playlist[] | undefined = playlistsByParent.get(parentID);
            if (playlistGroup == undefined) {
                return;
            }

            playlistGroup.sort((a, b) => a.position - b.position);

            for (const playlist of playlistGroup) {
                res.push(playlist);
                addWithChildren(playlist.id);
            }
        };

        addWithChildren(-1);

        return res;
    }

    private createPlaylist(playlist: Playlist): void {
        if (Elements.playlists.container == null) {
            return;
        }

        const strPlaylistID: string = String(playlist.id);

        const liElement: HTMLElement = document.createElement("li");
        liElement.classList.add("playlist-wrapper");
        liElement.setAttribute("playlist-id", strPlaylistID);

        const containerElement: HTMLElement = document.createElement("div");
        containerElement.classList.add("playlist-container");
        containerElement.setAttribute("playlist-id", strPlaylistID);
        liElement.appendChild(containerElement);

        containerElement.addEventListener("contextmenu", async (e: PointerEvent) => await this.app.contextmenuManager.createPlaylistContextMenu((e as Position), playlist));

        const thumbnailElement: HTMLElement = document.createElement("div");
        thumbnailElement.classList.add("thumbnail");
        thumbnailElement.setAttribute("playlist-id", strPlaylistID);
        thumbnailElement.style.backgroundImage = `url("${Functions.getThumbnailPath(playlist.thumbnailFileName)}")`;
        containerElement.appendChild(thumbnailElement);

        const detailsContainerElement: HTMLElement = document.createElement("div");
        detailsContainerElement.classList.add("details-container");
        detailsContainerElement.setAttribute("playlist-id", strPlaylistID);
        containerElement.appendChild(detailsContainerElement);

        const titleElement: HTMLElement = document.createElement("h3");
        titleElement.classList.add("extern-text");
        titleElement.setAttribute("playlist-id", strPlaylistID);
        titleElement.textContent = playlist.name;
        detailsContainerElement.appendChild(titleElement);

        if (playlist.children > 0) {
            const indicator: HTMLImageElement = document.createElement("img");
            indicator.classList.add("indicator");
            indicator.setAttribute("playlist-id", strPlaylistID);
            indicator.src = "assets/indicator.svg";
            containerElement.appendChild(indicator);

            if (playlist.opened) {
                containerElement.classList.add("opened");
            }

            containerElement.addEventListener("click", async () => {
                containerElement.classList.toggle("opened");

                const userData: UserData = this.app.account.getUserData();
                if (userData.id == null || userData.token == null) {
                    return;
                }

                const openedPlaylistIDs: number[] = this.app.playlistManager.getPlaylistOpenedStates();

                const updatePlaylistOpenedStatesReqRes: any = await Requests.playlist.updateOpenedState(userData.id, userData.token, openedPlaylistIDs);
                if (!updatePlaylistOpenedStatesReqRes.success) {
                    return this.app.throwError(`Can't update playlist opened states: ${updatePlaylistOpenedStatesReqRes.error}`);
                }
            });
            
        } else {
            containerElement.addEventListener("click", async () => await this.playlists.open(playlist.id));
        }

        const detailsElement: HTMLElement = document.createElement("span");
        detailsElement.classList.add("extern-text");
        detailsElement.setAttribute("playlist-id", strPlaylistID);
        detailsElement.textContent = (playlist.children == 0)
            ? `${playlist.songs} ${Functions.pluralize("song", playlist.songs)}`
            : `${playlist.children} ${Functions.pluralize("playlist", playlist.children)}`;
        detailsContainerElement.appendChild(detailsElement);

        const childrenContainerElement: HTMLElement = document.createElement("ul");
        childrenContainerElement.classList.add("children-container");
        liElement.appendChild(childrenContainerElement);

        const parent: Element | null = this.getParentToAppend(playlist);
        if (parent == null) {
            return this.app.throwError("Can't create playlist: Parent is null.");
        }

        parent.appendChild(liElement);
    }

    private getParentToAppend(playlist: Playlist): Element | null {
        if (playlist.parentID == -1) {
            return Elements.playlists.container;
        }

        if (Elements.playlists.container == null) {
            this.app.throwError("Can't get parent to append playlist: Playlist container element is null.");
            return null;
        }

        const liElement: Element | undefined = ([...Elements.playlists.container.querySelectorAll("li")] as Element[]).find((li: Element) => {
            if (!li.hasAttribute("playlist-id")) {
                return false;
            }

            const liPlaylistID: number = Number(li.getAttribute("playlist-id"));
            if (isNaN(liPlaylistID)) {
                return false;
            }
            
            return (liPlaylistID == playlist.parentID);
        });

        if (liElement == undefined) {
            return null;
        }

        return liElement.querySelector("ul.children-container");
    }
};
