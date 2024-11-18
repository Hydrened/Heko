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
                songsLis: [],
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
            removeSongsFromApp: {
                container: document.getElementById("remove-songs-from-app-modal"),
                name: document.getElementById("remove-songs-from-app-name"),
                input: document.getElementById("remove-songs-from-app-input"),
                songContainer: document.getElementById("remove-songs-from-app-song-container"),
                songsLis: [],
                confirmButton: document.getElementById("remove-songs-from-app-confirm-button"),
                cancelButton: document.getElementById("remove-songs-from-app-cancel-button"),
                message: document.getElementById("remove-songs-from-app-message"),
            },
        };

        this.closing = false;

        setTimeout(() => {
            this.initModals();
            this.handleEvents();
        }, 0);
    }

    handleEvents() {
        this.elements.createPlaylist.cancelButton.addEventListener("click", () => this.closeCreatePlaylistModal());
        this.elements.createPlaylist.confirmButton.addEventListener("click", () => {
            if (this.closing) return;
            this.closing = true;
            this.app.createPlaylist();
        });

        this.elements.confirmRemovePlaylist.cancelButton.addEventListener("click", () => this.closeConfirmRemovePlaylistModal());
        this.elements.confirmRemovePlaylist.confirmButton.addEventListener("click", () => {
            if (this.closing) return;
            this.closing = true;
            this.app.removePlaylist();
        });

        this.elements.renamePlaylist.cancelButton.addEventListener("click", () => this.closeRenamePlaylistModal());
        this.elements.renamePlaylist.confirmButton.addEventListener("click", () => {
            if (this.closing) return;
            this.closing = true;
            this.app.renamePlaylist();
        });

        this.elements.addSongsToPlaylist.cancelButton.addEventListener("click", () => this.closeAddSongsToPlaylistModal());
        this.elements.addSongsToPlaylist.confirmButton.addEventListener("click", () => {
            if (this.closing) return;
            this.closing = true;
            this.app.addSongsToPlaylist();
        });
        this.elements.addSongsToPlaylist.input.addEventListener("input", (e) => {
            const songLis = this.elements.addSongsToPlaylist.songsLis;
            const songsIn = this.app.currentPlaylist.songs.map((sID) => this.app.songs[sID].name);
            
            for (const id in songLis) {
                const songLi = songLis[id];
                const name = songLi.values.name.toLowerCase();
                const artist = songLi.values.artist.toLowerCase();
                songLi.element.classList.remove("hidden");
                if ((!name.includes(e.target.value.toLowerCase()) && !artist.includes(e.target.value.toLowerCase())) || songsIn.includes(songLi.values.name)) songLi.element.classList.add("hidden");
            }
        });

        this.elements.removeSongFromPlaylist.cancelButton.addEventListener("click", () => this.closeRemoveSongFromPlaylistModal());
        this.elements.removeSongFromPlaylist.confirmButton.addEventListener("click", () => {
            if (this.closing) return;
            this.closing = true;
            this.app.removeSongFromPlaylist();
        });

        this.elements.addSongToApp.cancelButton.addEventListener("click", () => this.closeAddSongToAppModal());
        this.elements.addSongToApp.confirmButton.addEventListener("click", () => {
            if (this.closing) return;
            this.closing = true;
            this.app.addSongToApp();
        });
        this.elements.addSongToApp.container.addEventListener("dragenter", (e) => {
            if (!e.dataTransfer.types.includes("Files")) return;
            this.elements.addSongToApp.file.classList.add("active");
        });
        this.elements.addSongToApp.file.addEventListener("dragleave", () => this.elements.addSongToApp.file.classList.remove("active"));
        this.elements.addSongToApp.file.addEventListener("drop", (e) => {
            if (e.dataTransfer.files[0].type != "audio/mpeg") e.preventDefault();
            this.elements.addSongToApp.file.classList.remove("active");
        });

        this.elements.removeSongsFromApp.cancelButton.addEventListener("click", () => this.closeRemoveSongsFromAppModal());
        this.elements.removeSongsFromApp.confirmButton.addEventListener("click", () => {
            if (this.closing) return;
            this.closing = true;
            this.app.removeSongsFromApp();
        });
        this.elements.removeSongsFromApp.input.addEventListener("input", (e) => {
            const songLis = this.elements.removeSongsFromApp.songsLis;
            
            for (const id in songLis) {
                const songLi = songLis[id];
                const name = songLi.values.name.toLowerCase();
                const artist = songLi.values.artist.toLowerCase();
                songLi.element.classList.remove("hidden");
                if ((!name.includes(e.target.value.toLowerCase()) && !artist.includes(e.target.value.toLowerCase()))) songLi.element.classList.add("hidden");
            }
        });
        
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("modal")) this.closeCurrentModal();
        });
    }

    initModals() {
        [this.elements.addSongsToPlaylist, this.elements.removeSongsFromApp].forEach((modal) => {
            for (const sID in this.app.songs) {
                const song = this.app.songs[sID];
    
                const li = document.createElement("li");
                li.setAttribute("song-id", sID);
                modal.songContainer.appendChild(li);
                modal.songsLis.push({
                    element: li,
                    values: {
                        name: song.name,
                        artist: song.artist,
                    },
                });
    
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
    }

    closeCurrentModal() {
        if (this.elements.createPlaylist.container.classList.contains("open")) this.closeCreatePlaylistModal();
        if (this.elements.confirmRemovePlaylist.container.classList.contains("open")) this.closeConfirmRemovePlaylistModal();
        if (this.elements.renamePlaylist.container.classList.contains("open")) this.closeRenamePlaylistModal();
        if (this.elements.addSongsToPlaylist.container.classList.contains("open")) this.closeAddSongsToPlaylistModal();
        if (this.elements.removeSongFromPlaylist.container.classList.contains("open")) this.closeRemoveSongFromPlaylistModal();
        if (this.elements.addSongToApp.container.classList.contains("open")) this.closeAddSongToAppModal();
        if (this.elements.removeSongsFromApp.container.classList.contains("open")) this.closeRemoveSongsFromAppModal();
    }

    isAModalOpened() {
        return this.elements.createPlaylist.container.classList.contains("open") ||
               this.elements.renamePlaylist.container.classList.contains("open") ||
               this.elements.confirmRemovePlaylist.container.classList.contains("open") ||
               this.elements.addSongsToPlaylist.container.classList.contains("open") ||
               this.elements.removeSongFromPlaylist.container.classList.contains("open") ||
               this.elements.addSongToApp.container.classList.contains("open") ||
               this.elements.removeSongsFromApp.container.classList.contains("open")
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
            this.closing = false;
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
        setTimeout(() => {
            this.closing = false;
        }, 500);
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
            this.closing = false;
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
            
            const songLis = this.elements.addSongsToPlaylist.songsLis;
            for (const id in songLis) {
                const songLi = songLis[id];
                songLi.element.querySelector("input").checked = false;
            }
            this.closing = false;
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
        const modal = this.elements.removeSongFromPlaylist;
        modal.container.classList.remove("open");
        setTimeout(() => {
            modal.message.textContent = "";
            this.closing = false;
        }, 500);
    }

    openAddSongToAppModal() {
        this.app.contextmenu.close();
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
            this.closing = false;
        }, 500);
    }

    openRemoveSongsFromAppModal() {
        this.app.contextmenu.close();
        const modal = this.elements.removeSongsFromApp;
        modal.container.classList.add("open");
        modal.input.focus();
        modal.input.dispatchEvent(new Event("input"));
    }

    closeRemoveSongsFromAppModal() {
        const modal = this.elements.removeSongsFromApp;
        modal.container.classList.remove("open");
        modal.input.blur();
        setTimeout(() => {
            modal.input.value = "";
            modal.message.textContent = "";
            
            const songLis = this.elements.removeSongsFromApp.songsLis;
            for (const id in songLis) {
                const songLi = songLis[id];
                songLi.element.querySelector("input").checked = false;
            }
            this.closing = false;
        }, 500);
    }
};
