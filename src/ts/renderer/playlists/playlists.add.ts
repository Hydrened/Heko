import PlaylistManager from "./playlists.js";
import App from "../app.js";
import CenterModal from "../modals/modal.center.js";
import * as Requests from "./../utils/utils.requests.js";
import * as Elements from "./../utils/utils.elements.js";
import ModalTop from "../modals/modal.top.js";

export default class PlaylistsAddManager {
    modal: CenterModal | null = null;

    constructor(private app: App, private playlists: PlaylistManager) {
        this.initEvents();
    }

    private initEvents(): void {
        if (Elements.playlists.addButton == null) {
            return this.app.throwError("Can't init add button events: Add button element is null.");
        }

        Elements.playlists.addButton.addEventListener("click", () => this.openModal());
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
        const newPlaylistName: string = res.rows["Name"].value;
        if (newPlaylistName.length < 3) {
            return {
                fieldName: "Name",
                error: "Name has to be at least 3 characters long.",
            };
        }

        const userData: UserData = this.app.account.getUserData();
        if (userData.id == null || userData.token == null) {
            return {
                error: "User is not connected.",
            };
        }

        const getAllPlaylistsFromUserReqRes: any = await Requests.playlist.getAllFromUser(userData.id, userData.token);
        if (!getAllPlaylistsFromUserReqRes.success) {
            this.app.throwError(`Can't get every playlist from user: ${getAllPlaylistsFromUserReqRes.error}`);
            return null;
        }
        
        const playlistNames: string[] = getAllPlaylistsFromUserReqRes.playlists.map((p: Playlist) => p.name);
        const playlistNameAlreadyExists: boolean = playlistNames.includes(newPlaylistName);
        
        if (playlistNameAlreadyExists) {
            return {
                fieldName: "Name",
                error: `Playlist with name "${newPlaylistName}" already exists.`,
            };
        }

        const addPlaylistReqRes: any = await Requests.playlist.add(userData.id, userData.token, newPlaylistName);
        if (!addPlaylistReqRes.success) {
            this.app.throwError(`Can't add playlist: ${addPlaylistReqRes.error}`);
            return null;
        }

        await this.playlists.refresh();
        ModalTop.create("SUCCESS", `Successfully created playlist "${newPlaylistName}".`);
        return null;
    }
};
