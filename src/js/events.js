class Events {
    constructor(a) {
        this.app = a;
        this.songOrder = "id";
        this.muted = false;

        const app = this.app;
        const songListener = app.songListener;
        const modals = app.modals;
        const aside = app.elements.aside;
        const currentPlaylist = app.elements.currentPlaylist;
        const footer = app.elements.footer;
        const manageSongsMenu = app.elements.manageSongsMenu;

        setTimeout(() => this.oldVolume = footer.volume.slider.value, 0);

        if (aside) {
            aside.createPlaylist.addEventListener("click", () => modals.openCreatePlaylistModal());
        }

        if (manageSongsMenu) {
            manageSongsMenu.openButton.addEventListener("click", () => {
                manageSongsMenu.container.classList.toggle("open");
                const rect = document.querySelector("aside > footer").getBoundingClientRect();
                manageSongsMenu.container.style.top = `${rect.y}px`;
                manageSongsMenu.container.style.left = `${rect.x + rect.width}px`;
            });
            manageSongsMenu.addButton.addEventListener("click", () => modals.openAddSongToAppModal());
            manageSongsMenu.removeButton.addEventListener("click", () => modals.openRemoveSongsFromAppModal());
        }

        if (currentPlaylist) {
            currentPlaylist.addSong.addEventListener("click", () => modals.openAddSongsToPlaylistModal(getPlaylistIdByName(app.playlists, app.currentPlaylist.name)));

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
        }
        
        if (footer) {
            footer.buttons.random.addEventListener("click", () => {
                app.settings.random = !app.settings.random;
                songListener.randomButton();
                footer.buttons.random.classList.toggle("activated");
            });
            footer.buttons.previous.addEventListener("click", () => {
                songListener.previousButton();
            });
            footer.buttons.play.addEventListener("click", () => {
                songListener.playButton();
                if (songListener.currentPlaylist.songs.length == 0) return;

                footer.buttons.pause.classList.remove("hidden");
                footer.buttons.play.classList.add("hidden");
                ipcRenderer.send("set-thumbnail-play-button", "pause");
            });
            footer.buttons.pause.addEventListener("click", () => {
                songListener.playButton();
                if (songListener.currentPlaylist.songs.length == 0) return;

                footer.buttons.pause.classList.add("hidden");
                footer.buttons.play.classList.remove("hidden");
                ipcRenderer.send("set-thumbnail-play-button", "play");
            });
            footer.buttons.next.addEventListener("click", () => {
                songListener.nextButton();
            });
            footer.buttons.loop.addEventListener("click", () => {
                app.settings.loop = !app.settings.loop;
                songListener.loopButton();
                footer.buttons.loop.classList.toggle("activated");
            });

            footer.volume.slider.addEventListener("input", (e) => {
                this.oldVolume = e.target.value;
                app.setVolume(e.target.value);
            });
            footer.volume.slider.addEventListener("wheel", (e) => {
                const currentVolumeValue = parseFloat(footer.volume.slider.value);
                const newVolumeValue = (e.deltaY > 0) ? Math.max(currentVolumeValue - 10, 0) : Math.min(currentVolumeValue + 10, 100);
                app.setVolume(newVolumeValue);
            })
            footer.song.slider.addEventListener("input", (e) => {
                if (songListener.getCurrentSongID() != -1) {
                    const duration = songListener.getCurrentSongDuration();
                    const time = e.target.value / 100 * duration;
                    songListener.setSongCurrentTime(time);

                } else e.target.value = 0;
                footer.song.slider.blur();
            });

            footer.volume.svg.no.parentNode.addEventListener("click", () => {
                this.muted = !this.muted;
                if (this.muted) app.setVolume(0);
                else app.setVolume(this.oldVolume);
            });
        }

        document.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            app.contextmenu.close();
            app.elements.manageSongsMenu.container.classList.remove("open");

            if (e.target.closest(`#${app.elements.aside.playlistsContainer.id} > li.playlist`)) {
                const playlistContainers = Array.from(app.elements.aside.playlistsContainer.querySelectorAll("li.playlist")).reverse();
                const playlistElement = playlistContainers.filter((pEl) => isChildOf(pEl, e.target))[0];
                const pID = parseInt(playlistElement.getAttribute("playlist-id"));
                const playlist = app.playlists[pID];

                const children = getChildrenByName(app.playlists, playlist.name).map((p) => p.name);
                const removedSelf = Object.values(app.playlists).filter((p) => p.name != playlist.name);
                const removedChildren = removedSelf.filter((p) => !children.includes(p.name));
                const removedParent = (playlist.parent != null) ? removedChildren.filter((p) => p.name != app.playlists[playlist.parent].name) : removedChildren;
                const mapped = removedParent.map((p) => { return { name: p.name, call: () => app.movePlaylist(pID, getPlaylistIdByName(app.playlists, p.name))}});
                if (playlist.parent != null) mapped.unshift({ name: "Root", call: () => app.movePlaylist(pID, null)});

                const menus = [
                    { name: "Rename playlist", call: () => modals.openRenamePlaylistModal(pID), children: [], shortcut: "F2" },
                    { name: "Remove playlist", call: () => modals.openConfirmRemovePlaylistModal(pID), children: [], shortcut: "Suppr" },
                    { name: "Duplicate playlist", call: () => app.duplicatePlaylist(pID), children: [], shortcut: "Ctrl+D" },
                    { name: "Move to", call: null, children: mapped, shortcut: null },
                ];

                if (menus.filter((m) => m.name == "Move to")[0].children.length == 0) menus.splice(menus.map((m) => m.name).indexOf("Move to"), 1);
                app.contextmenu.open(e, playlistElement.children[0], menus);
                return;
            }
            
            if (e.target.closest(`#${app.elements.aside.playlistsContainer.id}`)) {
                app.contextmenu.open(e, null, [{ name: "Create playlist", call: () => modals.openCreatePlaylistModal(), children: [], shortcut: "Ctrl+Alt+N" }]);
                return;
            }
            
            const songLi = e.target.closest(`ul#current-playlist-table-body > li`);
            if (songLi) {
                const sID = parseInt(songLi.getAttribute("song-id"));

                const playlists = [];
                for (const pID in app.playlists) {
                    const playlist = app.playlists[pID];
                    if (playlist.songs.includes(sID)) continue;
                    if (isPlaylistParent(app.playlists, pID)) continue;

                    playlists.push(pID);
                }
                const mappedAddToOtherPlaylistChildren = playlists.map((pID) => {
                    const playlist = app.playlists[pID];
                    return {
                        name: playlist.name,
                        call: () => { app.addSongsToPlaylist([sID], pID, null); },
                        children: [],
                        shortcut: null,
                    };
                });

                const menus = [
                    { name: "Add to queue", call: () => songListener.addToQueue(sID), children: [], shortcut: null },
                    { name: "Remove from playlist", call: () => modals.openRemoveSongFromPlaylistModal(getPlaylistIdByName(app.playlists, app.currentPlaylist.name), sID), children: [], shortcut: null },
                    { name: "Add to other playlist", call: null, children: mappedAddToOtherPlaylistChildren, shortcut: null },
                    { name: "Edit song", call: () => modals.openEditSongFromAppModal(sID), children: [], shortcut: null },
                ];

                if (songLi.classList.contains("error")) menus.splice(0, 1);
                app.contextmenu.open(e, songLi, menus);
                return;
            }

            if (e.target.closest(`ul#current-playlist-table-body`)) {
                app.contextmenu.open(e, null, [
                    { name: "Add song to playlist", call: () => modals.openAddSongsToPlaylistModal(getPlaylistIdByName(app.playlists, app.currentPlaylist.name)), children: [], shortcut: "Ctrl+N" },
                ]);
                return;
            }
        });
        document.addEventListener("click", (e) => {
            setTimeout(() => {
                app.contextmenu.close();
                if (!e.target.closest("button#manage-songs-open-button")) app.elements.manageSongsMenu.container.classList.remove("open");
            }, 10);
        });

        window.addEventListener("keydown", (e) => {
            if (!modals.isAModalOpened()) return;
            if (e.target == currentPlaylist.filter) return;

            switch (e.key) {
                case "Tab": e.preventDefault(); break;
                case "Escape":
                    modals.closeCurrentModal();
                    app.contextmenu.close();
                    break;
                case "Enter":
                    if (modals.elements.createPlaylist.container.classList.contains("open")) app.createPlaylistFromModal();
                    if (modals.elements.confirmRemovePlaylist.container.classList.contains("open")) app.removePlaylistFromModal();
                    if (modals.elements.renamePlaylist.container.classList.contains("open")) app.renamePlaylistFromModal();
                    if (modals.elements.addSongsToPlaylist.container.classList.contains("open")) app.addSongsToPlaylistFromModal();
                    if (modals.elements.removeSongFromPlaylist.container.classList.contains("open")) app.removeSongFromPlaylistFromModal();
                    if (modals.elements.addSongToApp.container.classList.contains("open")) app.addSongToAppFromModal();
                    if (modals.elements.removeSongsFromApp.container.classList.contains("open")) app.removeSongsFromAppFromModal();
                    if (modals.elements.editSongFromApp.container.classList.contains("open")) app.editSongFromAppFromModal();
                    break;

                default: break;
            }
        });
        window.addEventListener("keydown", (e) => {
            if (modals.isAModalOpened()) return;
            if (e.target == currentPlaylist.filter) return;

            if (!isNaN(e.key) && e.key.trim() != "") {
                if (!songListener.isSrcValid()) return;
                const duration = songListener.getCurrentSongDuration();
                songListener.setSongCurrentTime(duration * (parseInt(e.key) / 10));
                
            } else switch (e.key) {
                case "Escape":
                    app.elements.manageSongsMenu.container.classList.remove("open");
                    app.contextmenu.close();
                    break;

                case "F2": modals.openRenamePlaylistModal(getPlaylistIdByName(app.playlists, app.currentPlaylist.name)); break;
                case "Delete": modals.openConfirmRemovePlaylistModal(getPlaylistIdByName(app.playlists, app.currentPlaylist.name)); break;

                case "ArrowLeft":
                    if (!e.ctrlKey) {
                        if (!songListener.isSrcValid()) return;
                        const currentTime = songListener.getCurrentSongCurrentTime();
                        songListener.setSongCurrentTime(Math.max(currentTime - 5, 0));
                    } else songListener.previousButton();
                    break;
                case "ArrowRight":
                    if (!e.ctrlKey) {
                        if (!songListener.isSrcValid()) return;
                        const duration = songListener.getCurrentSongDuration();
                        const currentTime = songListener.getCurrentSongCurrentTime();
                        songListener.setSongCurrentTime(Math.min(currentTime + 5, duration));
                    } else songListener.nextButton();
                    break;

                case " ": 
                    if (songListener.isPaused()) footer.buttons.play.dispatchEvent(new Event("click"));
                    else footer.buttons.pause.dispatchEvent(new Event("click"));
                    break;

                case "l": footer.buttons.loop.dispatchEvent(new Event("click")); break;
                case "r": if (!e.ctrlKey) footer.buttons.random.dispatchEvent(new Event("click")); break;
                case "d": if (e.ctrlKey) app.duplicatePlaylist(getPlaylistIdByName(app.playlists, app.currentPlaylist.name)); break;
                case "m": footer.volume.svg.no.parentNode.dispatchEvent(new Event("click")); break;
                case "n": if (e.ctrlKey) {
                    if (e.altKey) app.modals.openCreatePlaylistModal();
                    else app.modals.openAddSongsToPlaylistModal(getPlaylistIdByName(app.playlists, app.currentPlaylist.name));
                } break;

                default: break;
            }
        });

        ipcRenderer.on("window-update", (e, data) => {
            app.settings.window.x = data.x;
            app.settings.window.y = data.y;
            app.settings.window.w = data.width;
            app.settings.window.h = data.height;
            app.settings.window.f = data.f;
        });
        ipcRenderer.on("song-control", (e, data) => {
            switch (data) {
                case "previous": footer.buttons.previous.dispatchEvent(new Event("click")); break;
                case "next": footer.buttons.next.dispatchEvent(new Event("click")); break;
                case "play": footer.buttons.play.dispatchEvent(new Event("click")); break;
                case "pause": footer.buttons.pause.dispatchEvent(new Event("click")); break;
            }
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
