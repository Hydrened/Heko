import PlaylistManager from "./playlists.js";
import App from "../app.js";
import CenterModal from "../modals/modal.center.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Elements from "./../utils/utils.elements.js";

export default class PlaylistsAddManager {
    modal: CenterModal | null = null;

    constructor(private app: App, private playlists: PlaylistManager) {
        this.initEvents();
    }

    private initEvents(): void {
        Elements.playlists.addButton?.addEventListener("click", () => this.openModal());
    }

    private openModal(): void {
        const content: ModalRow[] = [
            { label: "Name", type: "TEXT", maxLength: 150 },
        ];

        const data: CenterModalData = {
            title: "Create a playlist",
            content: content,
            onConfirm: (res: ModalRes): Promise<ModalError> => this.modalOnConfirm(res),
            cantClose: false,
        };

        this.modal = new CenterModal(this.app, data);
    }

    private async modalOnConfirm(res: ModalRes): Promise<ModalError> {
        const newPlaylistName: string = res[0].value;

        if (newPlaylistName.length < 3) {
            return "Can't create playlist: Name has to be at least 3 characters long.";
        }

        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return "Can't create playlist: User is not connected.";
        }

        const getAllPlaylistsFromUserReqRes: any = await Requests.playlist.getAllFromUser(userData.id, userData.token);
        if (!getAllPlaylistsFromUserReqRes.success) {
            return `Can't create playlist: ${getAllPlaylistsFromUserReqRes.error}`;
        }
        
        const playlistNames: string[] = getAllPlaylistsFromUserReqRes.playlists.map((p: Playlist) => p.name);
        const playlistNameAlreadyExists: boolean = playlistNames.includes(newPlaylistName);
        
        if (playlistNameAlreadyExists) {
            return `Can't create playlist: Playlist with name "${newPlaylistName}" already exists.`;
        }

        await Requests.playlist.add(userData.id, userData.token, newPlaylistName);
        await this.playlists.refresh();
        return null;
    }
};
