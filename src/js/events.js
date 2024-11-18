class Events {
    constructor(app) {
        this.app = app;

        this.app.elements.aside.createPlaylist.addEventListener("click", () => this.app.modals.openCreatePlaylistModal());

        this.app.elements.aside.manageSongsMenu.openButton.addEventListener("click", () => this.app.elements.aside.manageSongsMenu.container.classList.toggle("open"));
        this.app.elements.aside.manageSongsMenu.addButton.addEventListener("click", () => this.app.modals.openAddSongToAppModal());
        this.app.elements.aside.manageSongsMenu.removeButton.addEventListener("click", () => this.app.modals.openRemoveSongsFromAppModal());

        this.app.elements.currentPlaylist.addSong.addEventListener("click", () => this.app.modals.openAddSongsToPlaylistModal(getPlaylistIdByName(this.app.playlists, this.app.currentPlaylist.name)));

        this.app.elements.footer.buttons.random.addEventListener("click", () => {
            this.app.songListener.random();
            this.app.elements.footer.buttons.random.classList.toggle("activated");
        });

        this.app.elements.footer.buttons.previous.addEventListener("click", () => {
            this.app.songListener.previous();
        });

        this.app.elements.footer.buttons.play.addEventListener("click", () => {
            this.app.songListener.play();
        });

        this.app.elements.footer.buttons.pause.addEventListener("click", () => {
            this.app.songListener.play();
        });

        this.app.elements.footer.buttons.next.addEventListener("click", () => {
            this.app.songListener.next();
        });

        this.app.elements.footer.buttons.loop.addEventListener("click", () => {
            this.app.songListener.loop();
            this.app.elements.footer.buttons.loop.classList.toggle("activated");
        });

        this.app.elements.footer.volume.slider.addEventListener("input", (e) => this.app.setVolume(e.target.value));

        this.app.elements.footer.song.slider.addEventListener("input", (e) => {
            if (this.app.currentSondID == -1) return;
            const duration = this.app.songListener.getCurrentSongDuration();
            const time = e.target.value / 100 * duration;

            this.app.songListener.setCurrentTime(time);
        });

        this.app.elements.error.addEventListener("click", () => this.app.closeError());

        document.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            this.app.contextmenu.close();
            this.app.elements.aside.manageSongsMenu.container.classList.remove("open");

            if (e.target.closest(`#${this.app.elements.aside.playlistsContainer.id} > li.playlist`)) {
                const playlistContainers = Array.from(this.app.elements.aside.playlistsContainer.querySelectorAll("li.playlist")).reverse();
                const playlistElement = playlistContainers.filter((pEl) => isChildOf(pEl, e.target))[0];
                const pID = parseInt(playlistElement.getAttribute("playlist-id"));
                const playlist = this.app.playlists[pID];

                const children = getChildrenByName(this.app.playlists, playlist.name).map((p) => p.name);
                const removedSelf = Object.values(this.app.playlists).filter((p) => p.name != playlist.name);
                const removedChildren = removedSelf.filter((p) => !children.includes(p.name));
                const removedParent = (playlist.parent != null) ? removedChildren.filter((p) => p.name != this.app.playlists[playlist.parent].name) : removedChildren;
                const mapped = removedParent.map((p) => { return { name: p.name, call: () => this.app.movePlaylist(pID, getPlaylistIdByName(this.app.playlists, p.name))}});
                if (playlist.parent != null) mapped.unshift({ name: "Root", call: () => this.app.movePlaylist(pID, null)});

                this.app.contextmenu.open(e, playlistElement.children[0], [
                    { name: "Rename playlist", call: () => this.app.modals.openRenamePlaylistModal(pID), children: [], shortcut: "F2" },
                    { name: "Remove playlist", call: () => this.app.modals.openConfirmRemovePlaylistModal(pID), children: [], shortcut: "Suppr" },
                    { name: "Move to", call: null, children: mapped, shortcut: null },
                ]);
                return;
            }
            
            if (e.target.closest(`#${this.app.elements.aside.playlistsContainer.id}`)) {
                this.app.contextmenu.open(e, null, [{ name: "Create playlist", call: () => this.app.modals.openCreatePlaylistModal(), children: [], shortcut: "Ctrl+Alt+N" }]);
                return;
            }
            
            const songLi = e.target.closest(`ul#current-playlist-table-body > li`);
            if (songLi) {
                this.app.contextmenu.open(e, songLi, [
                    { name: "Add to queue", call: () => this.app.songListener.addToQueue(songLi.getAttribute("song-id")), children: [], shortcut: null },
                    { name: "Remove from playlist", call: () => this.app.modals.openRemoveSongFromPlaylistModal(getPlaylistIdByName(this.app.playlists, this.app.currentPlaylist.name), songLi.getAttribute("song-id")), children: [], shortcut: null },
                ]);
                return;
            }

            if (e.target.closest(`ul#current-playlist-table-body`)) {
                this.app.contextmenu.open(e, null, [
                    { name: "Add song to playlist", call: () => this.app.modals.openAddSongsToPlaylistModal(getPlaylistIdByName(this.app.playlists, this.app.currentPlaylist.name)), children: [], shortcut: "Ctrl+N" },
                ]);
                return;
            }
        });

        document.addEventListener("click", (e) => {
            setTimeout(() => {
                this.app.contextmenu.close();
                if (!e.target.closest("button#manage-songs-open-button")) this.app.elements.aside.manageSongsMenu.container.classList.remove("open");
            }, 10);
        });

        window.addEventListener("keydown", (e) => {
            if (!this.app.modals.isAModalOpened()) return;

            switch (e.key) {
                case "Tab": e.preventDefault(); break;
                case "Escape":
                    this.app.modals.closeCurrentModal();
                    this.app.contextmenu.close();
                    break;
                case "Enter":
                    if (this.app.modals.elements.createPlaylist.container.classList.contains("open")) this.app.createPlaylist();
                    if (this.app.modals.elements.confirmRemovePlaylist.container.classList.contains("open")) this.app.removePlaylist();
                    if (this.app.modals.elements.renamePlaylist.container.classList.contains("open")) this.app.renamePlaylist();
                    break;

                default: break;
            }
        });

        window.addEventListener("keydown", (e) => {
            if (this.app.modals.isAModalOpened()) return;

            switch (e.key) {
                case "Escape": this.app.elements.aside.manageSongsMenu.container.classList.remove("open"); break;

                case "F2": this.app.modals.openRenamePlaylistModal(getPlaylistIdByName(this.app.playlists, this.app.currentPlaylist.name)); break;
                case "Delete": this.app.modals.openConfirmRemovePlaylistModal(getPlaylistIdByName(this.app.playlists, this.app.currentPlaylist.name)); break;

                case "ArrowLeft": this.app.songListener.previous(); break;
                case "ArrowRight": this.app.songListener.next(); break;

                case " ":
                    if (this.app.songListener.getCurrentPlaylist().songs.length > 0) {
                        if (this.app.songListener.isPaused()) this.app.elements.footer.buttons.play.dispatchEvent(new Event("click"));
                        else this.app.elements.footer.buttons.pause.dispatchEvent(new Event("click"));
                    }
                    break;

                case "l": this.app.elements.footer.buttons.loop.dispatchEvent(new Event("click")); break;
                case "r": if (!e.ctrlKey) this.app.elements.footer.buttons.random.dispatchEvent(new Event("click")); break;
                case "n": if (e.ctrlKey) {
                    if (e.altKey) this.app.modals.openCreatePlaylistModal()
                    else this.app.modals.openAddSongsToPlaylistModal(getPlaylistIdByName(this.app.playlists, this.app.currentPlaylist.name));
                } break;

                default: break;
            }
        });

        ipcRenderer.on("window-size-changed", (e, data) => {
            this.app.window.x = data.x;
            this.app.window.y = data.y;
            this.app.window.w = data.width;
            this.app.window.h = data.height;
        });
    }
};
