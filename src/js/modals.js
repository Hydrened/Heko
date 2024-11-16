class Modals {
    constructor(app) {
        this.app = app;

        this.elements = {
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
            addSongsToPlaylist: {
                container: document.getElementById("add-songs-to-playlist-modal"),
                name: document.getElementById("add-songs-to-playlist-name"),
                input: document.getElementById("add-songs-to-playlist-input"),
                songContainer: document.getElementById("add-songs-to-playlist-song-container"),
                confirmButton: document.getElementById("add-songs-to-playlist-confirm-button"),
                cancelButton: document.getElementById("add-songs-to-playlist-cancel-button"),
                message: document.getElementById("add-songs-to-playlist-message"),
            },
            removeSongFromPlaylist: {
                container: document.getElementById("remove-song-from-playlist-modal"),
                song: document.getElementById("remove-song-from-playlist-song"),
                playlist: document.getElementById("remove-song-from-playlist-playlist"),
                confirmButton: document.getElementById("remove-song-from-playlist-confirm-button"),
                cancelButton: document.getElementById("remove-song-from-playlist-cancel-button"),
                message: document.getElementById("remove-song-from-playlist-message"),
            },
            addSongToApp: {
                container: document.getElementById("add-song-to-app-modal"),
                file: document.getElementById("add-song-to-app-file"),
                name: document.getElementById("add-song-to-app-name"),
                artist: document.getElementById("add-song-to-app-artist"),
                confirmButton: document.getElementById("add-song-to-app-confirm-button"),
                cancelButton: document.getElementById("add-song-to-app-cancel-button"),
                message: document.getElementById("add-song-to-app-message"),
            },
        };

        this.handleEvents();
    }

    handleEvents() {
        this.elements.createPlaylist.cancelButton.addEventListener("click", () => this.closeCreatePlaylistModal());
        this.elements.createPlaylist.confirmButton.addEventListener("click", () => this.app.createPlaylist());

        this.elements.confirmRemovePlaylist.cancelButton.addEventListener("click", () => this.closeConfirmRemovePlaylistModal());
        this.elements.confirmRemovePlaylist.confirmButton.addEventListener("click", () => this.app.removePlaylist());

        this.elements.renamePlaylist.cancelButton.addEventListener("click", () => this.closeRenamePlaylistModal());
        this.elements.renamePlaylist.confirmButton.addEventListener("click", () => this.app.renamePlaylist());

        this.elements.addSongsToPlaylist.cancelButton.addEventListener("click", () => this.closeAddSongsToPlaylistModal());
        this.elements.addSongsToPlaylist.confirmButton.addEventListener("click", () => this.app.addSongsToPlaylist());
        this.elements.addSongsToPlaylist.input.addEventListener("input", (e) => {
            const modal = this.elements.addSongsToPlaylist;
            modal.songContainer.innerHTML = "";

            const songsInPlaylist = this.app.playlists[getPlaylistIdByName(this.app.playlists, this.app.currentPlaylist.name)].songs;
            for (const sID in this.app.songs) {
                if (songsInPlaylist.includes(parseInt(sID))) continue;
                const song = this.app.songs[sID];
                if (!song.name.includes(e.target.value) && !song.artist.includes(e.target.value)) continue;
    
                const li = document.createElement("li");
                li.setAttribute("song-id", sID);
                this.elements.addSongsToPlaylist.songContainer.appendChild(li);

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                li.appendChild(checkbox);

                const details = document.createElement("p");
                details.textContent = `${song.name} by ${(song.artist != "") ? song.artist : "-"}`;
                li.appendChild(details);

                li.addEventListener("click", (e) => {
                    if (e.target.tagName == "INPUT") return;
                    checkbox.checked = !checkbox.checked;
                });
            }
        });

        this.elements.removeSongFromPlaylist.cancelButton.addEventListener("click", () => this.closeRemoveSongFromPlaylistModal());
        this.elements.removeSongFromPlaylist.confirmButton.addEventListener("click", () => this.app.removeSongFromPlaylist());

        this.elements.addSongToApp.cancelButton.addEventListener("click", () => this.closeAddSongToAppModal());
        this.elements.addSongToApp.confirmButton.addEventListener("click", () => this.app.addSong());
        this.elements.addSongToApp.container.addEventListener("dragenter", () => this.elements.addSongToApp.file.classList.add("active"));
        this.elements.addSongToApp.file.addEventListener("dragleave", () => this.elements.addSongToApp.file.classList.remove("active"));
        this.elements.addSongToApp.file.addEventListener("drop", (e) => this.elements.addSongToApp.file.classList.remove("active"));
        
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("modal")) this.closeCurrentModal();
        });
    }

    closeCurrentModal() {
        this.closeCreatePlaylistModal();
        this.closeConfirmRemovePlaylistModal();
        this.closeRenamePlaylistModal();
        this.closeAddSongsToPlaylistModal();
        this.closeRemoveSongFromPlaylistModal();
        this.closeAddSongToAppModal();
    }

    isAModalOpened() {
        return this.elements.createPlaylist.container.classList.contains("open") ||
               this.elements.renamePlaylist.container.classList.contains("open") ||
               this.elements.confirmRemovePlaylist.container.classList.contains("open") ||
               this.elements.addSongsToPlaylist.container.classList.contains("open") ||
               this.elements.removeSongFromPlaylist.container.classList.contains("open") ||
               this.elements.addSongToApp.container.classList.contains("open")
    }
    
    openCreatePlaylistModal() {
        this.app.contextmenu.close();
        const modal = this.elements.createPlaylist;
        modal.container.classList.add("open");
        modal.input.focus();
    }

    closeCreatePlaylistModal() {
        const modal = this.elements.createPlaylist;
        modal.container.classList.remove("open");
        modal.input.blur();
        setTimeout(() => {
            modal.input.value = "";
            modal.message.textContent = "";
        }, 500);
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
        this.app.contextmenu.close();
        const modal = this.elements.renamePlaylist;
        modal.name.textContent = this.app.playlists[id].name;
        modal.input.value = this.app.playlists[id].name;
        modal.container.classList.add("open");
        modal.input.focus();
    }

    closeRenamePlaylistModal() {
        const modal = this.elements.renamePlaylist;
        modal.container.classList.remove("open");
        modal.input.blur();
        setTimeout(() => {
            modal.input.value = "";
            modal.message.textContent = "";
        }, 500);
    }

    openAddSongsToPlaylistModal(id) {
        this.app.contextmenu.close();
        const modal = this.elements.addSongsToPlaylist;
        const playlist = this.app.playlists[id];
        modal.name.textContent = playlist.name;
        modal.container.classList.add("open");
        modal.input.focus();
        modal.input.dispatchEvent(new Event("input"));
    }

    closeAddSongsToPlaylistModal() {
        const modal = this.elements.addSongsToPlaylist;
        modal.container.classList.remove("open");
        modal.input.blur();
        setTimeout(() => {
            modal.input.value = "";
            modal.message.textContent = "";
        }, 500);
    }

    openRemoveSongFromPlaylistModal(pID, sID) {
        this.app.contextmenu.close();
        const modal = this.elements.removeSongFromPlaylist;
        const playlist = this.app.playlists[pID];
        const song = this.app.songs[sID];
        modal.song.textContent = song.name;
        modal.playlist.textContent = playlist.name;
        modal.container.classList.add("open");
    }

    closeRemoveSongFromPlaylistModal() {
        const modal = this.elements.removeSongFromPlaylist.container;
        modal.classList.remove("open");
        setTimeout(() => {
            modal.message.textContent = "";
        }, 500);
    }

    openAddSongToAppModal() {
        const modal = this.elements.addSongToApp;
        modal.container.classList.add("open");
    }

    closeAddSongToAppModal() {
        const modal = this.elements.addSongToApp;
        modal.container.classList.remove("open");
        setTimeout(() => {
            modal.name.value = "";
            modal.artist.value = "";
            modal.file.value = "";
            modal.message.textContent = "";
        }, 500);
    }
};
