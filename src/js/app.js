class App {
    constructor(mainFolder) {
        this.mainFolder = mainFolder;
        this.songs = {};
        this.playlists = {};
        this.saves = {};

        this.settings = {
            random: false,
            loop: false,
        };

        this.elements = {
            aside: {
                createPlaylist: document.getElementById("create-playlist-button"),
                playlistsContainer: document.getElementById("playlists-container"),
            },
            currentPlaylist: {
                container: document.getElementById("current-playlist"),
                thumbnail: document.getElementById("current-playlist-thumbnail"),
                title: document.getElementById("current-playlist-title"),
                nbSong: document.getElementById("current-playlist-nb-song"),
                songContainer: document.getElementById("current-playlist-table-body"),
            },
            footer: {
                buttons: {
                    random: document.getElementById("random-button"),
                    previous: document.getElementById("previous-button"),
                    play: document.getElementById("play-button"),
                    pause: document.getElementById("pause-button"),
                    next: document.getElementById("next-button"),
                    loop: document.getElementById("loop-button"),
                },
                volume: {
                    slider: document.getElementById("volume-slider"),
                    svg: {
                        no: document.getElementById("song-no-volume-logo"),
                        low: document.getElementById("song-low-volume-logo"),
                        high: document.getElementById("song-high-volume-logo"),
                    },
                },
                song: {
                    slider: document.getElementById("song-slider"),
                    duration: document.getElementById("song-duration"),
                    position: document.getElementById("song-position"),
                },
                details: {
                    title: document.getElementById("current-song-name"),
                    artist: document.getElementById("current-song-artist"),
                },
            },
        };

        this.currentPlaylist = null;
        this.currentSondID = -1;

        this.initData().then(() => {
            this.songListener = new SongListener(this);
            this.contextmenu = new Contextmenu(this);
            this.modals = new Modals(this);
            this.setVolume(this.saves.volume);

            this.handleEvents();
            this.initPlaylists();

            const parentIds = new Set(Object.values(this.playlists).map(playlist => playlist.parent).filter(parent => parent !== null));
            for (const [id, playlist] of Object.entries(this.playlists)) {
                if (!parentIds.has(parseInt(id))) {
                    this.openPlaylist(id);
                    this.songListener.setCurrentPlaylist(this.currentPlaylist);
                    break;
                }
            }

            this.initFromSaves();
            this.updateLoop();
        });
    }

    error(message) {
        const modal = this.elements.modal.error;
        modal.textContent = message;
        modal.classList.add("show");
        setTimeout(() => this.closeError(), 3000);
    }

    closeError() {
        const modal = this.elements.modal.error;
        modal.classList.add("closing");

        setTimeout(() => {
            modal.textContent = "";
            modal.classList.remove("show");
            modal.classList.remove("closing");
        }, 1000);
    }

    handleEvents() {
        this.elements.aside.createPlaylist.addEventListener("click", () => this.modals.openCreatePlaylistModal());

        this.elements.footer.buttons.random.addEventListener("click", () => {
            this.songListener.random();
            this.elements.footer.buttons.random.classList.toggle("activated");
        });

        this.elements.footer.buttons.previous.addEventListener("click", () => {
            this.songListener.previous();
            this.elements.footer.buttons.pause.classList.remove("hidden");
            this.elements.footer.buttons.play.classList.add("hidden");
        });

        this.elements.footer.buttons.play.addEventListener("click", () => {
            this.songListener.play();
            if (this.songListener.getError() == "") {
                this.elements.footer.buttons.pause.classList.remove("hidden");
                this.elements.footer.buttons.play.classList.add("hidden");
            }
        });

        this.elements.footer.buttons.pause.addEventListener("click", () => {
            this.songListener.play();
            this.elements.footer.buttons.play.classList.remove("hidden");
            this.elements.footer.buttons.pause.classList.add("hidden");
        });

        this.elements.footer.buttons.next.addEventListener("click", () => {
            this.songListener.next();
            this.elements.footer.buttons.pause.classList.remove("hidden");
            this.elements.footer.buttons.play.classList.add("hidden");
        });

        this.elements.footer.buttons.loop.addEventListener("click", () => {
            this.songListener.loop();
            this.elements.footer.buttons.loop.classList.toggle("activated");
        });

        this.elements.footer.volume.slider.addEventListener("input", (e) => this.setVolume(e.target.value));

        this.elements.footer.song.slider.addEventListener("input", (e) => {
            const duration = this.songListener.getCurrentSongDuration();
            const time = e.target.value / 100 * duration;

            this.songListener.setCurrentTime(time);
        });

        document.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            this.contextmenu.close();

            if (e.target.closest(`#${this.elements.aside.playlistsContainer.id} > li.playlist`)) {
                const playlistContainers = Array.from(this.elements.aside.playlistsContainer.querySelectorAll("li.playlist")).reverse();
                const playlistElement = playlistContainers.filter((pEl) => isChildOf(pEl, e.target))[0];
                const pID = parseInt(playlistElement.getAttribute("playlist-id"));
                const playlist = this.playlists[pID];

                const children = getChildrenByName(this.playlists, playlist.name).map((p) => p.name);
                const removedSelf = Object.values(this.playlists).filter((p) => p.name != playlist.name);
                const removedChildren = removedSelf.filter((p) => !children.includes(p.name));
                const removedParent = (playlist.parent != null) ? removedChildren.filter((p) => p.name != this.playlists[playlist.parent].name) : removedChildren;
                const mapped = removedParent.map((p) => { return { name: p.name, call: () => this.movePlaylist(pID, getPlaylistIdByName(this.playlists, p.name))}});
                if (playlist.parent != null) mapped.unshift({ name: "Root", call: () => this.movePlaylist(pID, null)});

                this.contextmenu.open(e, playlistElement.children[0], [
                    { name: "Rename playlist", call: () => this.modals.openRenamePlaylistModal(pID), children: [], shortcut: null },
                    { name: "Remove playlist", call: () => this.modals.openConfirmRemovePlaylistModal(pID), children: [], shortcut: null },
                    { name: "Move to", call: null, children: mapped, shortcut: null },
                ]);
                return;
            }
            
            if (e.target.closest(`#${this.elements.aside.playlistsContainer.id}`)) {
                this.contextmenu.open(e, null, [{ name: "Create playlist", call: () => this.modals.openCreatePlaylistModal(), children: [], shortcut: "Ctrl+N" }]);
                return;
            }
            
            const songLi = e.target.closest(`ul#current-playlist-table-body > li`);
            if (songLi) {
                this.contextmenu.open(e, songLi, [
                    { name: "Add to queue", call: () => this.songListener.addToQueue(songLi.getAttribute("song-id")), children: [], shortcut: null },
                    { name: "Remove from playlist", call: null, children: [], shortcut: null },
                ]);
                return;
            }

            if (e.target.closest(`ul#current-playlist-table-body`)) {
                this.contextmenu.open(e, null, [
                    { name: "Add song to playlist", call: null, children: [], shortcut: null },
                ]);
                return;
            }
        });

        document.addEventListener("click", () => {
            setTimeout(() => this.contextmenu.close(), 10);
        });

        window.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "Tab": e.preventDefault(); break;

                case "Escape":
                    if (this.modals.elements.createPlaylist.container.classList.contains("open")) this.modals.closeCreatePlaylistModal();
                    if (this.modals.elements.confirmRemovePlaylist.container.classList.contains("open")) this.modals.closeConfirmRemovePlaylistModal();
                    if (this.modals.elements.renamePlaylist.container.classList.contains("open")) this.modals.closeRenamePlaylistModal();
                    this.contextmenu.close();
                    break;
                case "Enter":
                    if (this.modals.elements.createPlaylist.container.classList.contains("open")) this.createPlaylist();
                    if (this.modals.elements.confirmRemovePlaylist.container.classList.contains("open")) this.removePlaylist();
                    if (this.modals.elements.renamePlaylist.container.classList.contains("open")) this.renamePlaylist();
                    break;

                case "ArrowLeft": this.songListener.previous(); break;
                case "ArrowRight": this.songListener.next(); break;

                case " ":
                    if (this.songListener.getCurrentPlaylist().songs.length > 0) {
                        if (this.songListener.isPaused()) this.elements.footer.buttons.play.dispatchEvent(new Event("click"));
                        else this.elements.footer.buttons.pause.dispatchEvent(new Event("click"));
                    }
                    break;
                case "l": this.elements.footer.buttons.loop.dispatchEvent(new Event("click")); break;
                case "r": this.elements.footer.buttons.random.dispatchEvent(new Event("click")); break;
                case "n": if (e.ctrlKey) this.modals.openCreatePlaylistModal(); break;

                default: break;
            }
        });
    }

    initData() {
        let volume = 0;
        const readSaves = fsp.readFile(this.mainFolder + "/data/saves.json", "utf8").then(data => {
            const jsonData = JSON.parse(data);
            this.settings.loop = jsonData.loop;
            this.settings.random = jsonData.random;
            this.saves.volume = jsonData.volume;
        }).catch(err => this.error("Error reading saves.json:", err));

        const readSongs = fsp.readFile(this.mainFolder + "/data/songs.json", "utf8").then(data => {
            this.songs = JSON.parse(data);
        }).catch(err => this.error("Error reading songs.json:", err));

        const readPlaylists = fsp.readFile(this.mainFolder + "/data/playlists.json", "utf8").then(data => {
            this.playlists = JSON.parse(data);
        }).catch(err => this.error("Error reading playlists.json:", err));

        return Promise.all([readSaves, readSongs, readPlaylists]).then().catch(err => this.error("Error reading json files :", err));
    }

    initPlaylists() {
        sortPlaylistsByDependencies(this.playlists).forEach((playlist) => {
            const id = getPlaylistIdByName(this.playlists, playlist.name);

            const li = document.createElement("li");
            li.classList.add("playlist");
            li.setAttribute("playlist-id", id);
            
            if (playlist.parent == null) this.elements.aside.playlistsContainer.appendChild(li);
            else document.getElementById(`children-container-${playlist.parent}`).appendChild(li);
    
            const container = document.createElement("div");
            container.classList.add("container");
            li.appendChild(container);
            
            const thumbnail = document.createElement("div");
            thumbnail.classList.add("thumbnail");
            if (playlist.thumbnail != "") thumbnail.style.backgroundImage = `url("${this.mainFolder}/thumbnails/${playlist.thumbnail}")`;
            container.appendChild(thumbnail);
        
            const details = document.createElement("div");
            details.classList.add("details");
            container.appendChild(details);
        
            const title = document.createElement("h4");
            title.textContent = playlist.name;
            details.appendChild(title);
        
            const content = document.createElement("h5");
            details.appendChild(content);
        
            const childrenContainer = document.createElement("ul");
            childrenContainer.classList.add("children-container");
            childrenContainer.classList.add("show");
            childrenContainer.id = `children-container-${id}`;
            li.appendChild(childrenContainer);
        });

        const appendPlaylists = document.querySelectorAll("[playlist-id]");
        for (let i = 0; i < appendPlaylists.length; i++) {
            const playlist = appendPlaylists[i];
            const playlistContainer = playlist.querySelector("div");
            const childrenContainer = playlist.querySelector("ul");
            const nbSubPlaylist = childrenContainer.children.length;
            const pID = parseInt(playlist.getAttribute("playlist-id"));
            const content = playlist.querySelector("h5");
            let arrow = null;

            if (nbSubPlaylist == 0) {
                const nbSongs = this.playlists[pID].songs.length;
                content.textContent = `${nbSongs} song${(nbSongs < 2) ? "" : "s"}`;
            } else {
                arrow = document.createElement("p");
                arrow.classList.add("arrow");
                arrow.textContent = ">";
                playlistContainer.appendChild(arrow);
                content.textContent = `${nbSubPlaylist} playlist${(nbSubPlaylist < 2) ? "" : "s"}`;
            }

            playlistContainer.addEventListener("click", () => {
                if (nbSubPlaylist != 0) {
                    childrenContainer.classList.toggle("show");
                    arrow.classList.toggle("show");
                } else {
                    this.openPlaylist(pID);
                    if (this.currentSondID == -1) this.songListener.setCurrentPlaylist(this.playlists[pID]);
                }
            });
        }
    }

    initFromSaves() {
        this.setVolume(this.saves.volume * 100);
        if (this.saves.random) this.elements.footer.buttons.random.dispatchEvent(new Event("click"));
        if (this.saves.loop) this.elements.footer.buttons.loop.dispatchEvent(new Event("click"));
    }

    updateLoop() {
        if (!this.songListener.isPaused()) {
            const currentTime = this.songListener.getCurrentSongCurrentTime();
            const duration = this.songListener.getCurrentSongDuration();
            const currentSong = this.songs[this.currentSondID];

            if (!isNaN(currentTime) && !isNaN(duration)) {
                this.elements.footer.song.position.textContent = formatTime(parseInt(currentTime));
                this.elements.footer.song.duration.textContent = formatTime(parseInt(duration));
                this.elements.footer.song.slider.value = currentTime / duration * 100;
                this.elements.footer.details.title.textContent = currentSong.name;
                this.elements.footer.details.artist.textContent = `by ${(currentSong.artist == "") ? "-" : currentSong.artist}`;
            }
        }
        
        setTimeout(() => this.updateLoop(), 16.67);
    }

    openPlaylist(id) {
        const playlist = this.playlists[id];

        if (playlist != this.currentPlaylist) {
            if (playlist) {
                this.elements.currentPlaylist.container.classList.remove("open");
                this.currentPlaylist = playlist;
                setTimeout(() => {
                    this.elements.currentPlaylist.container.classList.add("open");
                    this.elements.currentPlaylist.songContainer.innerHTML = "";

                    this.elements.currentPlaylist.thumbnail.style.backgroundImage = `url("${this.mainFolder}/thumbnails/${playlist.thumbnail}")`;
                    this.elements.currentPlaylist.title.textContent = playlist.name;
                    this.elements.currentPlaylist.nbSong.textContent = `${playlist.songs.length} songs`;
                    if (playlist.songs.length < 2) this.elements.currentPlaylist.nbSong.textContent = this.elements.currentPlaylist.nbSong.textContent.slice(0, -1);

                    playlist.songs.forEach((sID, index) => {
                        const song = this.songs[sID];

                        if (song) {
                            const li = document.createElement("li");
                            li.setAttribute("song-id", sID);
                            this.elements.currentPlaylist.songContainer.appendChild(li);

                            const nb = document.createElement("p");
                            nb.textContent = index + 1;
                            li.appendChild(nb);

                            const title = document.createElement("p");
                            title.textContent = song.name;
                            li.appendChild(title);

                            const artist = document.createElement("p");
                            artist.textContent = (song.artist == "") ? "-" : song.artist;
                            li.appendChild(artist);

                            const duration = document.createElement("p");
                            const audio = document.createElement("audio");
                            audio.src = `${this.mainFolder}/songs/${song.src}`;
                            duration.textContent = "-:--";
                            audio.addEventListener("loadedmetadata", () => duration.textContent = formatTime(parseInt(audio.duration)));
                            li.appendChild(duration);

                            li.addEventListener("click", () => {
                                this.elements.footer.buttons.pause.classList.remove("hidden");
                                this.elements.footer.buttons.play.classList.add("hidden");
                                this.songListener.setCurrentPlaylist(playlist);
                                this.songListener.playSong(sID);
                            });
                        }
                    });
                }, 600);
            } else this.error(`Playlist ID "${id}" not found`);
        }
    }

    createPlaylist() {
        const modal = this.modals.elements.createPlaylist;
        const name = modal.input.value;
        modal.message.classList.value = "";
        modal.message.textContent = "";
        
        const errors = getPlaylistNameErrors(this.playlists, name);
        if (errors.length == 0) {
            const playlistsFile = path.join(this.mainFolder, "data/playlists.json");
            fsp.readFile(playlistsFile, "utf-8").then((data) => {
                const jsonData = JSON.parse(data);
                const id = parseInt(Object.keys(jsonData).at(-1)) + 1;

                jsonData[id] = {
                    name: name,
                    thumbnail: "",
                    songs: [],
                    parent: null,
                };

                fsp.writeFile(playlistsFile, JSON.stringify(jsonData, null, 2), "utf8").then(() => {
                    modal.message.textContent = `Playlist "${name}" sucessfuly created!`;
                    modal.message.classList.remove("error");
                    modal.message.classList.add("success");

                    setTimeout(() => {
                        this.modals.closeCreatePlaylistModal();
                        setTimeout(() => window.location.href = "", 600);
                    }, 1500);
                }).catch((readErr) => this.error("Error: cant write playlists.json"));
            }).catch((readErr) => this.error("Error: cant read playlists.json"));
        } else {
            modal.message.textContent = errors[0];
            modal.message.classList.add("error");
        }
    }

    removePlaylist() {
        const modal = this.modals.elements.confirmRemovePlaylist;
        const id = getPlaylistIdByName(this.playlists, modal.name.textContent);
        const playlist = this.playlists[id];

        const playlistsFile = path.join(this.mainFolder, "data/playlists.json");
        fsp.readFile(playlistsFile, "utf-8").then((data) => {
            const jsonData = JSON.parse(data);
            delete jsonData[id];

            for (const pID in jsonData) {
                const p = jsonData[pID];
                if (p.parent == id) p.parent = null;
            }

            fsp.writeFile(playlistsFile, JSON.stringify(jsonData, null, 2), "utf8").then(() => {
                modal.message.textContent = `Playlist "${playlist.name}" sucessfuly removed!`;
                modal.message.classList.remove("error");
                modal.message.classList.add("success");

                setTimeout(() => {
                    this.modals.closeConfirmRemovePlaylistModal();
                    setTimeout(() => window.location.href = "", 600);
                }, 1500);
            }).catch((readErr) => this.error("Error: cant write playlists.json"));
        }).catch((readErr) => this.error("Error: cant read playlists.json"));
    }
    
    renamePlaylist() {
        const modal = this.modals.elements.renamePlaylist;
        const id = getPlaylistIdByName(this.playlists, modal.name.textContent);
        const newName = modal.input.value;

        const errors = getPlaylistNameErrors(this.playlists, newName);
        if (errors.length == 0) {
            const playlistsFile = path.join(this.mainFolder, "data/playlists.json");
            fsp.readFile(playlistsFile, "utf-8").then((data) => {
                const jsonData = JSON.parse(data);
                jsonData[id].name = newName;

                fsp.writeFile(playlistsFile, JSON.stringify(jsonData, null, 2), "utf8").then(() => {
                    modal.message.textContent = `Playlist "${newName}" sucessfuly renamed!`;
                    modal.message.classList.remove("error");
                    modal.message.classList.add("success");

                    setTimeout(() => {
                        this.modals.closeRenamePlaylistModal();
                        setTimeout(() => window.location.href = "", 600);
                    }, 1500);
                }).catch((readErr) => this.error("Error: cant write playlists.json"));
            }).catch((readErr) => this.error("Error: cant read playlists.json"));
        } else {
            modal.message.textContent = errors[0];
            modal.message.classList.add("error");
        }
    }

    movePlaylist(playlistID, parentID) {
        const playlistsFile = path.join(this.mainFolder, "data/playlists.json");
        fsp.readFile(playlistsFile, "utf-8").then((data) => {
            const jsonData = JSON.parse(data);
            jsonData[playlistID].parent = parentID;

            fsp.writeFile(playlistsFile, JSON.stringify(jsonData, null, 2), "utf8").then(() => window.location.href = "").catch((readErr) => this.error("Error: cant write playlists.json"));
        }).catch((readErr) => this.error("Error: cant read playlists.json"));
    }

    setVolume(volume) {
        this.elements.footer.volume.slider.value = volume;
        if (volume <= 0) {
            this.elements.footer.volume.svg.no.classList.remove("hidden");
            this.elements.footer.volume.svg.low.classList.add("hidden");
            this.elements.footer.volume.svg.high.classList.add("hidden");
        } else if (volume < 50) {
            this.elements.footer.volume.svg.no.classList.add("hidden");
            this.elements.footer.volume.svg.low.classList.remove("hidden");
            this.elements.footer.volume.svg.high.classList.add("hidden");
        } else {
            this.elements.footer.volume.svg.no.classList.add("hidden");
            this.elements.footer.volume.svg.low.classList.add("hidden");
            this.elements.footer.volume.svg.high.classList.remove("hidden");
        }
        this.songListener.setVolume(Math.pow(volume / 100, 3));
    }
};
