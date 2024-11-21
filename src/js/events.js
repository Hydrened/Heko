class Events {
    constructor(app) {
        this.app = app;
        this.songOrder = "id";

        const aside = this.app.elements.aside;
        const currentPlaylist = this.app.elements.currentPlaylist;
        const footer = this.app.elements.footer;
        const manageSongsMenu = this.app.elements.manageSongsMenu;

        setTimeout(() => this.oldVolume = footer.volume.slider.value, 0);

        aside.createPlaylist.addEventListener("click", () => this.app.modals.openCreatePlaylistModal());

        manageSongsMenu.openButton.addEventListener("click", () => {
            manageSongsMenu.container.classList.toggle("open");
            const rect = document.querySelector("aside > footer").getBoundingClientRect();
            manageSongsMenu.container.style.top = `${rect.y}px`;
            manageSongsMenu.container.style.left = `${rect.x + rect.width}px`;
        });
        manageSongsMenu.addButton.addEventListener("click", () => this.app.modals.openAddSongToAppModal());
        manageSongsMenu.removeButton.addEventListener("click", () => this.app.modals.openRemoveSongsFromAppModal());

        currentPlaylist.addSong.addEventListener("click", () => this.app.modals.openAddSongsToPlaylistModal(getPlaylistIdByName(this.app.playlists, this.app.currentPlaylist.name)));

        currentPlaylist.filter.addEventListener("input", (e) => {
            const songs = [...currentPlaylist.songContainer.children];
            songs.forEach((song) => {
                const name = song.children[1].textContent.toLowerCase();
                const artist = song.children[2].textContent.toLowerCase();
                song.classList.remove("hidden");
                if (!name.includes(e.target.value.toLowerCase()) && !artist.includes(e.target.value.toLowerCase())) song.classList.add("hidden");
            });
        });

        currentPlaylist.sort.id.addEventListener("click", () => {
            if (this.songOrder == "id") this.sortSongBy("id-reverse");
            else this.sortSongBy("id");
        });
        currentPlaylist.sort.title.addEventListener("click", () => {
            if (this.songOrder == "title") this.sortSongBy("title-reverse");
            else this.sortSongBy("title");
        });
        currentPlaylist.sort.artist.addEventListener("click", () => {
            if (this.songOrder == "artist") this.sortSongBy("artist-reverse");
            else this.sortSongBy("artist");
        });
        currentPlaylist.sort.duration.addEventListener("click", () => {
            if (this.songOrder == "duration") this.sortSongBy("duration-reverse");
            else this.sortSongBy("duration");
        });

        footer.buttons.random.addEventListener("click", () => {
            this.app.songListener.random();
            footer.buttons.random.classList.toggle("activated");
        });
        footer.buttons.previous.addEventListener("click", () => {
            this.app.songListener.previous();
        });
        footer.buttons.play.addEventListener("click", () => {
            this.app.songListener.play();
        });
        footer.buttons.pause.addEventListener("click", () => {
            this.app.songListener.play();
        });
        footer.buttons.next.addEventListener("click", () => {
            this.app.songListener.next();
        });
        footer.buttons.loop.addEventListener("click", () => {
            this.app.songListener.loop();
            footer.buttons.loop.classList.toggle("activated");
        });

        footer.volume.slider.addEventListener("input", (e) => {
            this.oldVolume = e.target.value;
            this.app.setVolume(e.target.value);
        });
        footer.song.slider.addEventListener("input", (e) => {
            if (this.app.currentSondID == -1) return;
            const duration = this.app.songListener.getCurrentSongDuration();
            const time = e.target.value / 100 * duration;

            this.app.songListener.setCurrentTime(time);
        });
        footer.volume.svg.no.parentNode.addEventListener("click", () => {
            this.app.settings.muted = !this.app.settings.muted;
            if (this.app.settings.muted) this.app.setVolume(0);
            else this.app.setVolume(this.oldVolume);
        });

        this.app.elements.error.addEventListener("click", () => this.app.closeError());

        document.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            this.app.contextmenu.close();
            this.app.elements.manageSongsMenu.container.classList.remove("open");

            const playlistLi = e.target.closest(`#${this.app.elements.aside.playlistsContainer.id} > li.playlist`);

            if (playlistLi) {
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

                const menus = [
                    { name: "Rename playlist", call: () => this.app.modals.openRenamePlaylistModal(pID), children: [], shortcut: "F2" },
                    { name: "Remove playlist", call: () => this.app.modals.openConfirmRemovePlaylistModal(pID), children: [], shortcut: "Suppr" },
                    { name: "Duplicate playlist", call: () => this.app.duplicatePlaylist(pID), children: [], shortcut: "Ctrl+D" },
                    { name: "Move to", call: null, children: mapped, shortcut: null },
                ];

                if (menus.filter((m) => m.name == "Move to")[0].children.length == 0) menus.splice(menus.map((m) => m.name).indexOf("Move to"), 1);
                this.app.contextmenu.open(e, playlistElement.children[0], menus);
                return;
            }
            
            if (e.target.closest(`#${this.app.elements.aside.playlistsContainer.id}`)) {
                this.app.contextmenu.open(e, null, [{ name: "Create playlist", call: () => this.app.modals.openCreatePlaylistModal(), children: [], shortcut: "Ctrl+Alt+N" }]);
                return;
            }
            
            const songLi = e.target.closest(`ul#current-playlist-table-body > li`);
            if (songLi) {
                const menus = [
                    { name: "Add to queue", call: () => this.app.songListener.addToQueue(songLi.getAttribute("song-id")), children: [], shortcut: null },
                    { name: "Remove from playlist", call: () => this.app.modals.openRemoveSongFromPlaylistModal(getPlaylistIdByName(this.app.playlists, this.app.currentPlaylist.name), songLi.getAttribute("song-id")), children: [], shortcut: null },
                ];

                if (songLi.classList.contains("error")) menus.splice(0, 1);
                this.app.contextmenu.open(e, songLi, menus);
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
                if (!e.target.closest("button#manage-songs-open-button")) this.app.elements.manageSongsMenu.container.classList.remove("open");
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
                    if (this.app.modals.elements.addSongsToPlaylist.container.classList.contains("open")) this.app.addSongsToPlaylist();
                    if (this.app.modals.elements.removeSongFromPlaylist.container.classList.contains("open")) this.app.removeSongFromPlaylist();
                    if (this.app.modals.elements.addSongToApp.container.classList.contains("open")) this.app.addSongToApp();
                    if (this.app.modals.elements.removeSongsFromApp.container.classList.contains("open")) this.app.removeSongsFromApp();
                    break;

                default: break;
            }
        });
        window.addEventListener("keydown", (e) => {
            if (this.app.modals.isAModalOpened()) return;

            switch (e.key) {
                case "Escape": this.app.elements.manageSongsMenu.container.classList.remove("open"); break;

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
                case "d": if (e.ctrlKey) this.app.duplicatePlaylist(getPlaylistIdByName(this.app.playlists, this.app.currentPlaylist.name)); break;
                case "m": footer.volume.svg.no.parentNode.dispatchEvent(new Event("click")); break;
                case "n": if (e.ctrlKey) {
                    if (e.altKey) this.app.modals.openCreatePlaylistModal();
                    else this.app.modals.openAddSongsToPlaylistModal(getPlaylistIdByName(this.app.playlists, this.app.currentPlaylist.name));
                } break;

                default: break;
            }
        });

        ipcRenderer.on("window-update", (e, data) => {
            this.app.window.x = data.x;
            this.app.window.y = data.y;
            this.app.window.w = data.width;
            this.app.window.h = data.height;
            this.app.window.f = data.f;
        });
    }

    sortSongBy(order) {
        this.songOrder = order;
        const currentPlaylist = this.app.elements.currentPlaylist;
        const reverse = order.includes("reverse");
        const songs = [...currentPlaylist.songContainer.children];

        for (const t in currentPlaylist.sort) {
            const element = currentPlaylist.sort[t];
            if (order.includes(t)) element.classList.add("sorted-by");
            else element.classList.remove("sorted-by");
        }

        if (order.includes("id")) songs.sort((a, b) => {
            const intA = parseInt(a.children[0].textContent);
            const intB = parseInt(b.children[0].textContent);
            return intA - intB;
        }); else if (order.includes("duration")) songs.sort((a, b) => {
            const durationA = parseDuration(a.children[3].textContent.trim());
            const durationB = parseDuration(b.children[3].textContent.trim());
            return durationA - durationB;
        }); else {
            const childrenIndex = (order.includes("title")) ? 1 : 2;
            songs.sort((a, b) => a.children[childrenIndex].textContent.localeCompare(b.children[childrenIndex].textContent));
        }

        if (reverse) songs.reverse();

        songs.forEach((song) => {
            currentPlaylist.songContainer.appendChild(song);
        });
    }
};
