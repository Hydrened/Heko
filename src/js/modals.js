class Modals {
    constructor(app) {
        this.app = app;

        this.elements = {
            error: document.getElementById("error-modal"),
            createPlaylist: {
                container: document.getElementById("create-playlist-modal"),
                input: document.getElementById("create-playlist-modal-input"),
                confirmButton: document.getElementById("create-playlist-modal-confirm-button"),
                cancelButton: document.getElementById("create-playlist-modal-cancel-button"),
                message: document.getElementById("create-playlist-modal-message"),
            },
            confirmRemovePlaylist: {
                container: document.getElementById("confirm-remove-playlist-modal"),
                name: document.getElementById("confirm-remove-playlist-name"),
                confirmButton: document.getElementById("confirm-remove-playlist-confirm-button"),
                cancelButton: document.getElementById("confirm-remove-playlist-cancel-button"),
                message: document.getElementById("confirm-remove-playlist-message"),
            },
            renamePlaylist: {
                container: document.getElementById("rename-playlist-modal"),
                name: document.getElementById("rename-playlist-name"),
                input: document.getElementById("rename-playlist-input"),
                confirmButton: document.getElementById("rename-playlist-confirm-button"),
                cancelButton: document.getElementById("rename-playlist-cancel-button"),
                message: document.getElementById("rename-playlist-message"),
            },
        };

        this.handleEvents();
    }

    handleEvents() {
        this.elements.error.addEventListener("click", () => this.closeError());

        this.elements.createPlaylist.cancelButton.addEventListener("click", () => this.closeCreatePlaylistModal());
        this.elements.createPlaylist.confirmButton.addEventListener("click", () => this.app.createPlaylist());

        this.elements.confirmRemovePlaylist.cancelButton.addEventListener("click", () => this.closeConfirmRemovePlaylistModal());
        this.elements.confirmRemovePlaylist.confirmButton.addEventListener("click", () => this.app.removePlaylist());

        this.elements.renamePlaylist.cancelButton.addEventListener("click", () => this.closeRenamePlaylistModal());
        this.elements.renamePlaylist.confirmButton.addEventListener("click", () => this.app.renamePlaylist());
    }
    
    openCreatePlaylistModal() {
        this.app.contextmenu.close();
        const modal = this.elements.createPlaylist;
        modal.container.classList.add("open");
        modal.input.focus();
    }

    closeCreatePlaylistModal() {
        const modal = this.elements.createPlaylist.container;
        modal.classList.remove("open");
    }

    openConfirmRemovePlaylistModal(id) {
        this.app.contextmenu.close();
        const modal = this.elements.confirmRemovePlaylist;
        modal.name.textContent = this.app.playlists[id].name;
        modal.container.classList.add("open");
    }

    closeConfirmRemovePlaylistModal() {
        const modal = this.elements.confirmRemovePlaylist.container;
        modal.classList.remove("open");
    }

    openRenamePlaylistModal(id) {
        const modal = this.elements.renamePlaylist;
        modal.name.textContent = this.app.playlists[id].name;
        modal.input.value = this.app.playlists[id].name;
        modal.container.classList.add("open");
        modal.input.focus();
    }

    closeRenamePlaylistModal() {
        this.app.contextmenu.close();
        const modal = this.elements.renamePlaylist.container;
        modal.classList.remove("open");
    }
};
