import PlaylistsManager from "./playlists.js";
import App from "../app.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Elements from "./../utils/utils.elements.js";
import * as Functions from "./../utils/utils.functions.js";

export default class PlaylistsRefreshManager {
    constructor(private app: App, private playlists: PlaylistsManager) {

    }

    public async refresh(): Promise<void> {
        Functions.removeChildren(Elements.playlists.container);

        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return;
        }

        const getPlaylistsReqRes: any = await Requests.playlist.get(userData.id, userData.token);
        const playlists: Playlist[] = this.sortPlaylists((getPlaylistsReqRes.playlists as Playlist[]));
        
        playlists.forEach((playlist: Playlist) => this.createPlaylist(playlist));
    }

    private sortPlaylists(playlists: Playlist[]): Playlist[] {
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

        const liElement: HTMLElement = document.createElement("li");
        liElement.setAttribute("playlist-id", String(playlist.id));

        const containerElement: HTMLElement = document.createElement("div");
        containerElement.classList.add("playlist-container");
        liElement.appendChild(containerElement);

        const thumbnailElement: HTMLElement = document.createElement("div");
        thumbnailElement.classList.add("thumbnail");
        containerElement.appendChild(thumbnailElement);

        const titleElement: HTMLElement = document.createElement("h3");
        titleElement.textContent = playlist.name;
        containerElement.appendChild(titleElement);

        if (playlist.children > 0) {
            const indicator: HTMLImageElement = document.createElement("img");
            indicator.classList.add("indicator");
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

                const openedPlaylistIDs: number[] = this.app.playlists.getPlaylistOpenedStates();
                await Requests.playlist.updateOpenedState(userData.id, userData.token, openedPlaylistIDs);
            });
        }

        const detailsElement: HTMLElement = document.createElement("span");
        detailsElement.textContent = (playlist.children == 0)
            ? `${playlist.songs} ${Functions.displayWord("song", playlist.songs)}`
            : `${playlist.children} ${Functions.displayWord("playlist", playlist.children)}`;
        titleElement.appendChild(detailsElement);

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
