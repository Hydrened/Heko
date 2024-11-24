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
                fakeDragZone: document.getElementById("add-song-to-app-fake-drag-zone"),
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
            editSongFromApp: {
                container: document.getElementById("edit-song-from-app-modal"),
                name: document.getElementById("edit-song-from-app-name"),
                nameInput: document.getElementById("edit-song-from-app-input-name"),
                artistInput: document.getElementById("edit-song-from-app-input-artist"),
                confirmButton: document.getElementById("edit-song-from-app-confirm-button"),
                cancelButton: document.getElementById("edit-song-from-app-cancel-button"),
                message: document.getElementById("edit-song-from-app-message"),
            },
        };

        this.closing = false;

        setTimeout(() => {
            this.initModals();
            this.handleEvents();
        }, 0);
    }

    handleEvents() {
        const createPlaylistModal = this.elements.createPlaylist;
        if (createPlaylistModal) {
            createPlaylistModal.cancelButton.addEventListener("click", () => this.closeCreatePlaylistModal());
            createPlaylistModal.confirmButton.addEventListener("click", () => {
                if (this.closing) return;
                this.closing = true;
                this.app.createPlaylistFromModal();
            });
        }

        const confirmRemovePlaylistModal = this.elements.confirmRemovePlaylist;
        if (confirmRemovePlaylistModal) {
            confirmRemovePlaylistModal.cancelButton.addEventListener("click", () => this.closeConfirmRemovePlaylistModal());
            confirmRemovePlaylistModal.confirmButton.addEventListener("click", () => {
                if (this.closing) return;
                this.closing = true;
                this.app.removePlaylistFromModal();
            });
        }

        const renamePlaylistModal = this.elements.renamePlaylist;
        if (renamePlaylistModal) {
            renamePlaylistModal.cancelButton.addEventListener("click", () => this.closeRenamePlaylistModal());
            renamePlaylistModal.confirmButton.addEventListener("click", () => {
                if (this.closing) return;
                this.closing = true;
                this.app.renamePlaylistFromModal();
            });
        }

        const addSongsToPlaylistModal = this.elements.addSongsToPlaylist;
        if (addSongsToPlaylistModal) {
            addSongsToPlaylistModal.cancelButton.addEventListener("click", () => this.closeAddSongsToPlaylistModal());
            addSongsToPlaylistModal.confirmButton.addEventListener("click", () => {
                if (this.closing) return;
                this.closing = true;
                this.app.addSongsToPlaylistFromModal();
            });
            addSongsToPlaylistModal.input.addEventListener("input", (e) => {
                const songLis = addSongsToPlaylistModal.songsLis;
                const songsIn = this.app.currentPlaylist.songs.map((sID) => this.app.songs[sID].name);
                
                for (const id in songLis) {
                    const songLi = songLis[id];
                    const name = songLi.values.name.toLowerCase();
                    const artist = songLi.values.artist.toLowerCase();
                    songLi.element.classList.remove("hidden");
                    if ((!name.includes(e.target.value.toLowerCase()) && !artist.includes(e.target.value.toLowerCase())) || songsIn.includes(songLi.values.name)) songLi.element.classList.add("hidden");
                }
            });
        }

        const removeSongFromPlaylistModal = this.elements.removeSongFromPlaylist;
        if (removeSongFromPlaylistModal) {
            removeSongFromPlaylistModal.cancelButton.addEventListener("click", () => this.closeRemoveSongFromPlaylistModal());
            removeSongFromPlaylistModal.confirmButton.addEventListener("click", () => {
                if (this.closing) return;
                this.closing = true;
                this.app.removeSongFromPlaylistFromModal();
            });
        }

        const addSongToAppModal = this.elements.addSongToApp;
        if (addSongToAppModal) {
            addSongToAppModal.cancelButton.addEventListener("click", () => this.closeAddSongToAppModal());
            addSongToAppModal.confirmButton.addEventListener("click", () => {
                if (this.closing) return;
                this.closing = true;
                this.app.addSongToAppFromModal();
            });
            addSongToAppModal.container.addEventListener("dragenter", (e) => {
                if (!e.dataTransfer.types.includes("Files")) return;
                addSongToAppModal.file.classList.add("active");
            });
            addSongToAppModal.file.addEventListener("dragleave", () => addSongToAppModal.file.classList.remove("active"));
            addSongToAppModal.file.addEventListener("change", (e) => {
                const file = e.target.files[0];
                const dropEvent = new DragEvent("drop", {
                    dataTransfer: new DataTransfer(),
                });
                dropEvent.dataTransfer.items.add(file);
                addSongToAppModal.file.dispatchEvent(dropEvent);
            });
            addSongToAppModal.file.addEventListener("change", (e) => {
                const fakeDragZone = addSongToAppModal.fakeDragZone;
                if (addSongToAppModal.file.files.length > 0) {
                    fakeDragZone.classList.add("contains-file");
                    fakeDragZone.textContent = e.target.files[0].name;
                } else {
                    fakeDragZone.classList.remove("contains-file");
                    fakeDragZone.textContent = "Drag file here";
                }
            });
            addSongToAppModal.file.addEventListener("drop", (e) => {
                addSongToAppModal.message.textContent = "";
                addSongToAppModal.message.classList.remove("error");

                if (e.dataTransfer.files[0].type != "audio/mpeg") {
                    e.preventDefault();
                    addSongToAppModal.file.value = "";
                    addSongToAppModal.message.textContent = "File has to be a song format";
                    addSongToAppModal.message.classList.add("error");
                }
                addSongToAppModal.file.classList.remove("active");
            });
            addSongToAppModal.fakeDragZone.addEventListener("click", () => addSongToAppModal.file.click());
            addSongToAppModal.name.addEventListener("keydown", (e) => {
                if (e.key == "Tab") addSongToAppModal.artist.focus();
            });
            addSongToAppModal.artist.addEventListener("keydown", (e) => {
                if (e.key == "Tab") addSongToAppModal.name.focus();
            });
        }
        
        const removeSongsFromAppModal = this.elements.removeSongsFromApp;
        if (removeSongsFromAppModal) {
            removeSongsFromAppModal.cancelButton.addEventListener("click", () => this.closeRemoveSongsFromAppModal());
            removeSongsFromAppModal.confirmButton.addEventListener("click", () => {
                if (this.closing) return;
                this.closing = true;
                this.app.removeSongsFromAppFromModal();
            });
            removeSongsFromAppModal.input.addEventListener("input", (e) => {
                const songLis = removeSongsFromAppModal.songsLis;
                
                for (const id in songLis) {
                    const songLi = songLis[id];
                    const name = songLi.values.name.toLowerCase();
                    const artist = songLi.values.artist.toLowerCase();
                    songLi.element.classList.remove("hidden");
                    if ((!name.includes(e.target.value.toLowerCase()) && !artist.includes(e.target.value.toLowerCase()))) songLi.element.classList.add("hidden");
                }
            });
        }

        const editSongFromAppModal = this.elements.editSongFromApp;
        if (editSongFromAppModal) {
            editSongFromAppModal.cancelButton.addEventListener("click", () => this.closeEditSongFromAppModal());
            editSongFromAppModal.confirmButton.addEventListener("click", () => {
                if (this.closing) return;
                this.closing = true;
                this.app.editSongFromAppFromModal();
            });
            editSongFromAppModal.nameInput.addEventListener("keydown", (e) => {
                if (e.key == "Tab") editSongFromAppModal.artistInput.focus();
            });
            editSongFromAppModal.artistInput.addEventListener("keydown", (e) => {
                if (e.key == "Tab") editSongFromAppModal.nameInput.focus();
            });
        }
        
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
                details.textContent = `${song.name} by ${song.artist}`;
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
        if (this.elements.editSongFromApp.container.classList.contains("open")) this.closeEditSongFromAppModal();
    }

    isAModalOpened() {
        return this.elements.createPlaylist.container.classList.contains("open") ||
               this.elements.renamePlaylist.container.classList.contains("open") ||
               this.elements.confirmRemovePlaylist.container.classList.contains("open") ||
               this.elements.addSongsToPlaylist.container.classList.contains("open") ||
               this.elements.removeSongFromPlaylist.container.classList.contains("open") ||
               this.elements.addSongToApp.container.classList.contains("open") ||
               this.elements.removeSongsFromApp.container.classList.contains("open") ||
               this.elements.editSongFromApp.container.classList.contains("open")
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
        modal.fakeDragZone.classList.remove("contains-file");
        modal.fakeDragZone.textContent = "Drag file here";
        modal.name.focus();
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

    openEditSongFromAppModal(sID) {
        this.app.contextmenu.close();
        const modal = this.elements.editSongFromApp;
        modal.container.classList.add("open");
        modal.name.textContent = this.app.songs[sID].name;
        modal.nameInput.value = this.app.songs[sID].name;
        modal.artistInput.value = this.app.songs[sID].artist;
        modal.nameInput.focus();
    }

    closeEditSongFromAppModal() {
        const modal = this.elements.editSongFromApp;
        modal.container.classList.remove("open");
        setTimeout(() => {
            modal.name.textContent = "";
            modal.nameInput.value = "";
            modal.artistInput.value = "";
            modal.message.textContent = "";
            this.closing = false;
        }, 500);
    }
};
