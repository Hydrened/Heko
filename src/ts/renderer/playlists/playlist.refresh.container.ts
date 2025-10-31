import App from "./../app.js";
import PlaylistManager from "./playlists.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Functions from "./../utils/utils.functions.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistsRefreshCotnainerManager {
    constructor(private app: App, private playlists: PlaylistManager) {

    }

    public refresh(): void {
        const animation: boolean = (Elements.playlists.container.children.length == 0);
        Functions.removeChildren(Elements.playlists.container);
        
        const playlists: Playlist[] = this.playlists.getSortedPlaylists();
        playlists.forEach((playlist: Playlist) => this.createPlaylist(playlist));

        if (!animation) {
            return;
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

    private createPlaylist(playlist: Playlist): void {
        const strPlaylistID: string = String(playlist.id);

        const liElement: HTMLElement = document.createElement("li");
        liElement.classList.add("playlist-wrapper");
        liElement.setAttribute("playlist-id", strPlaylistID);

        const containerElement: HTMLElement = document.createElement("div");
        containerElement.classList.add("playlist-container");
        containerElement.setAttribute("playlist-id", strPlaylistID);
        liElement.appendChild(containerElement);

        containerElement.addEventListener("contextmenu", (e: PointerEvent) => this.app.contextmenuManager.createPlaylistContextMenu((e as Position), playlist));

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

                const openedPlaylistIDs: number[] = this.playlists.getPlaylistOpenedStates();

                const updatePlaylistOpenedStatesReqRes: any = await Requests.playlist.updateOpenedState(userData.id, userData.token, openedPlaylistIDs);
                if (!updatePlaylistOpenedStatesReqRes.success) {
                    return this.app.throwError(`Can't update playlist opened states: ${updatePlaylistOpenedStatesReqRes.error}`);
                }
            });
            
        } else {
            containerElement.addEventListener("click", async () => {
                
                const currentOpenedPlaylist: Playlist | null = this.app.playlistManager.getCurrentOpenedPlaylist();
                if (currentOpenedPlaylist != null) {
                    if (currentOpenedPlaylist.id == playlist.id) {
                        return;
                    }
                }

                await this.playlists.open(playlist.id);
            });
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
