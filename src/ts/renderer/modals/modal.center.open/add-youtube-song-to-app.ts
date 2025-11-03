import App from "./../../app.js";
import CenterModal from "./../modal.center.js";
import CenterSearchModal from "./../modal.center.search.js";

async function addYoutubeSongToAppModalOnConfirm(app: App, userSongs: Song[], modal: CenterModal): Promise<ModalError> {
    return null;
}

export default function openAddYoutubeSongToAppModal(app: App, userSongs: Song[]): void {
    const data: CenterSearchModalData = {
        title: "Search song on Youtube",
        onConfirm: async (modal: CenterModal) => await addYoutubeSongToAppModalOnConfirm(app, userSongs, modal),
        cantClose: false,
    };

    new CenterSearchModal(app, data);
}
