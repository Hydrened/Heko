class App {
    constructor(mainFolder) {
        this.mainFolder = mainFolder;
        this.songs = null;
        this.playlists = null;
        this.stats = null;

        this.settings = null;
        this.currentPlaylist = null;

        this.sliderMenu = null;

        this.elements = {
            aside: {
                createPlaylist: document.getElementById("create-playlist-button"),
                playlistsContainer: document.getElementById("playlists-container"),
                manageSongsButton: document.getElementById("manage-songs-open-button"),
            },
            currentPlaylist: {
                container: document.getElementById("current-playlist"),
                thumbnail: document.getElementById("current-playlist-thumbnail"),
                title: document.getElementById("current-playlist-title"),
                nbSong: document.getElementById("current-playlist-nb-song"),
                duration: document.getElementById("current-playlist-duration"),
                addSong: document.getElementById("add-songs-to-current-playlist-button"),
                filter: document.getElementById("current-playlist-song-filter-input"),
                sort: {
                    id: document.getElementById("current-playlist-sort-by-id"),
                    title: document.getElementById("current-playlist-sort-by-title"),
                    artist: document.getElementById("current-playlist-sort-by-artist"),
                    duration: document.getElementById("current-playlist-sort-by-duration"),
                },
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
                other: {
                    playbackRate: document.getElementById("playback-rate-button"),
                    queue: document.getElementById("open-queue-button"),
                    volume: {
                        slider: document.getElementById("volume-slider"),
                        svg: {
                            no: document.getElementById("song-no-volume-logo"),
                            low: document.getElementById("song-low-volume-logo"),
                            high: document.getElementById("song-high-volume-logo"),
                        },
                    },
                },
                song: {
                    slider: document.getElementById("song-slider"),
                    duration: document.getElementById("song-duration"),
                    position: document.getElementById("song-position"),
                },
                details: {
                    title: document.getElementById("current-song-name").querySelector("span"),
                    artist: document.getElementById("current-song-artist").querySelector("span"),
                },
            },
            success: document.getElementById("success-modal"),
            error: document.getElementById("error-modal"),
        };

        const url = new URL(window.location.href);
        const params = url.searchParams;
        const playlistToOpen = params.get("p");

        this.initData().then(() => {
            this.songListener = new SongListener(this);
            this.contextmenu = new Contextmenu(this);
            this.modals = new Modals(this);
            this.events = new Events(this);
            this.tooltip = new Tooltip();

            this.initPlaylists();

            if (!playlistToOpen) {
                const parentIds = new Set(Object.values(this.playlists).map(playlist => playlist.parent).filter(parent => parent !== null));
                for (const [id, playlist] of Object.entries(this.playlists)) {
                    if (!parentIds.has(parseInt(id))) {
                        this.openPlaylist(id, (params.get("r")) ? true : false);
                        break;
                    }
                }
            } else this.openPlaylist(playlistToOpen, true);

            this.initFromSettings();
            this.updateLoop();
            this.songListener.initQueues();
            
            setTimeout(() => {
                if (params.get("sort")) this.events.sortSongBy(params.get("sort"));
                if (params.get("filter")) {
                    this.elements.currentPlaylist.filter.value = params.get("filter");
                    this.elements.currentPlaylist.filter.dispatchEvent(new Event("input"));
                }
            }, 0);
        });
    }

    success(message) {
        const success = this.elements.success;

        function close() {
            success.classList.add("closing");

            setTimeout(() => {
                success.textContent = "";
                success.classList.remove("show");
                success.classList.remove("closing");
            }, 1000);
        }

        if (!success.classList.contains("show")) {
            success.textContent = message;
            success.classList.add("show");
            setTimeout(() => {
                if (message == success.textContent) close();
            }, 5000);
        } else {
            close();
            setTimeout(() => this.success(message), 1000);
        }
    }

    error(message) {
        const error = this.elements.error;

        function close() {
            error.classList.add("closing");

            setTimeout(() => {
                error.textContent = "";
                error.classList.remove("show");
                error.classList.remove("closing");
            }, 1000);
        }

        if (!error.classList.contains("show")) {
            error.textContent = message;
            error.classList.add("show");
            setTimeout(() => {
                if (message == error.textContent) close();
            }, 5000);
        } else {
            close();
            setTimeout(() => this.error(message), 1000);
        }
    }

    async initData() {
        const readSettings = fsp.readFile(path.join(this.mainFolder, "data", "settings.json"), "utf8").then(data => {
            const jsonData = JSON.parse(data);
            this.settings = jsonData;

            const root = document.documentElement;
            root.style.setProperty("--col-1", jsonData.colors.main);
        }).catch(err => this.error("ERROR HK-101 => Could not read settings.json:", err));

        const readSongs = fsp.readFile(path.join(this.mainFolder, "data", "songs.json"), "utf8").then(data => {
            this.songs = JSON.parse(data);
        }).catch(err => this.error("ERROR HK-102 => Could not read songs.json:", err));

        const readPlaylists = fsp.readFile(path.join(this.mainFolder, "data", "playlists.json"), "utf8").then(data => {
            this.playlists = JSON.parse(data);
        }).catch(err => this.error("ERROR HK-103 => Could not read playlists.json:", err));

        const readStats = fsp.readFile(path.join(this.mainFolder, "data", "stats.json"), "utf8").then((data) => {
            this.stats = JSON.parse(data);
        }).catch(err => this.error("ERROR HK-118 => Could not read stats.json:", err));

        return Promise.all([readSettings, readSongs, readPlaylists]).then().catch(err => this.error("ERROR HK-104 => Could not read json files:", err));
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
            if (this.settings.playlists[id]) childrenContainer.classList.add("show");
            childrenContainer.id = `children-container-${id}`;
            li.appendChild(childrenContainer);
        });

        [...document.querySelectorAll("[playlist-id]")].forEach((playlist) => {
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
                if (!this.settings.playlists[pID]) arrow.classList.add("show");
                arrow.textContent = ">";
                playlistContainer.appendChild(arrow);
                content.textContent = `${nbSubPlaylist} playlist${(nbSubPlaylist < 2) ? "" : "s"}`;
            }

            playlistContainer.addEventListener("click", () => {
                if (nbSubPlaylist != 0) {
                    childrenContainer.classList.toggle("show");
                    arrow.classList.toggle("show");
                } else this.openPlaylist(pID, false);
            });
        });
    }

    initFromSettings() {
        this.setVolume(this.settings.volume * 100);
        if (this.settings.random) {
            this.settings.random = false;
            this.elements.footer.buttons.random.dispatchEvent(new Event("click"));
        }
        if (this.settings.loop) {
            this.settings.loop = false;
            this.elements.footer.buttons.loop.dispatchEvent(new Event("click"));
        }
        this.songListener.setSpeed(this.settings.playbackRate);
    }

    updateLoop() {
        const currentData = this.songListener.getCurrentData();

        if (!currentData.isPaused) {
            const currentTime = currentData.currentTime;
            const duration = currentData.duration;
            const currentSong = this.songs[currentData.songID];

            if (!isNaN(currentTime) && !isNaN(duration)) {
                this.elements.footer.song.position.textContent = formatTime(parseInt(currentTime));
                this.elements.footer.song.duration.textContent = formatTime(parseInt(duration));
                this.elements.footer.song.slider.value = currentTime / duration * 100;
                this.elements.footer.details.title.textContent = currentSong.name;
                this.elements.footer.details.artist.textContent = `by ${currentSong.artist}`;
            }
        }

        if (currentData.songID != -1) {
            if (currentData.playlist.name == this.currentPlaylist.name) {
                const songLis = [...this.elements.currentPlaylist.songContainer.children];
                songLis.filter((el) => el.classList.remove("playing"));
                const li = songLis.filter((el) => parseInt(el.getAttribute("song-id")) == currentData.songID)[0];
                if (li) li.classList.add("playing");
            }
        }

        this.tooltip.refresh();
        setTimeout(() => this.updateLoop(), 16.67);
    }

    openPlaylist(id, instant) {
        const playlist = this.playlists[id];

        if (playlist != this.currentPlaylist) {
            if (playlist) {
                this.events.sortSongBy("id");

                this.elements.currentPlaylist.container.classList.remove("open");
                this.currentPlaylist = playlist;
                setTimeout(() => {
                    const table = document.querySelector(".current-playlist-table");
                    if (instant == true) {
                        this.elements.currentPlaylist.container.style.transition = "0ms";
                        table.style.transition = "0ms";
                    }

                    this.elements.currentPlaylist.container.classList.add("open");
                    this.elements.currentPlaylist.songContainer.innerHTML = "";
                    this.elements.currentPlaylist.filter.value = "";
                    this.elements.currentPlaylist.duration.textContent = "";

                    if (instant == true) setTimeout(() => {
                        this.elements.currentPlaylist.container.style.transition = "";
                        table.style.transition = "";
                    }, 1);

                    // const thumbnailPath = path.resolve(this.mainFolder, "thumbnails", playlist.thumbnail);
                    // if (fs.existsSync(thumbnailPath)) this.elements.currentPlaylist.thumbnail.style.backgroundImage = `url("${this.mainFolder}/thumbnails/${playlist.thumbnail}")`;

                    this.elements.currentPlaylist.title.textContent = playlist.name;
                    this.elements.currentPlaylist.nbSong.textContent = `${playlist.songs.length} songs`;
                    if (playlist.songs.length < 2) this.elements.currentPlaylist.nbSong.textContent = this.elements.currentPlaylist.nbSong.textContent.slice(0, -1);

                    playlist.songs.forEach((sID, index) => {
                        const song = this.songs[sID];
                        const songPath = path.resolve(this.mainFolder, "songs", song.src);

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
                            artist.textContent = song.artist;
                            li.appendChild(artist);

                            const duration = document.createElement("p");
                            const audio = document.createElement("audio");
                            duration.textContent = "-:--";
                            li.appendChild(duration);

                            audio.addEventListener("error", (e) => {
                                if (!e.target.error) return;
                                li.classList.add("error");
                            });
                            if (fs.existsSync(songPath)) {
                                audio.src = songPath;
                                audio.addEventListener("loadedmetadata", () => {
                                    duration.textContent = formatTime(parseInt(audio.duration));

                                    const act = (this.elements.currentPlaylist.duration.textContent == "") ? 0 : parseDuration(this.elements.currentPlaylist.duration.textContent);
                                    this.elements.currentPlaylist.duration.textContent = formatTime(act + parseInt(audio.duration));
                                });
                            } else li.classList.add("error");

                            li.addEventListener("click", () => this.songListener.setCurrentPlaylist(playlist, index, 1));
                        }
                    });
                    
                }, (instant == true) ? 0 : 600);
            } else this.error(`ERROR HK-301 => Playlist ID "${id}" not found`);
        }
    }

    setVolume(volume) {
        this.elements.footer.other.volume.slider.value = volume;
        this.settings.volume = volume / 100;

        if (volume <= 0) {
            this.elements.footer.other.volume.svg.no.classList.remove("hidden");
            this.elements.footer.other.volume.svg.low.classList.add("hidden");
            this.elements.footer.other.volume.svg.high.classList.add("hidden");

        } else if (volume < 75) {
            this.elements.footer.other.volume.svg.no.classList.add("hidden");
            this.elements.footer.other.volume.svg.low.classList.remove("hidden");
            this.elements.footer.other.volume.svg.high.classList.add("hidden");

        } else {
            this.elements.footer.other.volume.svg.no.classList.add("hidden");
            this.elements.footer.other.volume.svg.low.classList.add("hidden");
            this.elements.footer.other.volume.svg.high.classList.remove("hidden");
        }
        this.songListener.setVolume(Math.pow(volume / 100, 3));
    }

    refresh(pID) {
        const songListenerData = this.songListener.getCurrentData();
        const jsonSongListenerData = encodeURIComponent(JSON.stringify(songListenerData));

        const parameters = [{ name: "r", data: true }];
        if (pID != null) parameters.push({ name: "p", data: pID });
        if (songListenerData.playlist) parameters.push({ name: "d", data: jsonSongListenerData });
        parameters.push({ name: "sort", data: this.events.songOrder });
        parameters.push({ name: "filter", data: this.elements.currentPlaylist.filter.value });

        const url = `index.html${(parameters.length > 0) ? "?" : ""}${parameters.map((p) => `${p.name}=${p.data}&`).join("").slice(0, -1)}`;
        window.location.href = url;
    }

    createPlaylistFromModal() {
        const modal = this.modals.elements.top.createPlaylist;
        const name = modal.input.value;
        modal.message.classList.value = "";
        modal.message.textContent = "";
        
        const errors = getPlaylistNameErrors(this.playlists, name);
        if (errors.length == 0) {
            const playlistsFile = path.join(this.mainFolder, "data", "playlists.json");
            fsp.readFile(playlistsFile, "utf8").then((data) => {
                const jsonData = JSON.parse(data);
                this.settings.lastPlaylistID = parseInt(this.settings.lastPlaylistID) + 1;
                const id = parseInt(this.settings.lastPlaylistID);

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
                        setTimeout(() => this.refresh(id), 600);
                    }, 1500);
                }).catch((writeErr) => this.error("ERROR HK-206 => Could not write playlists.json:" + writeErr));
            }).catch((readErr) => this.error("ERROR HK-105 => Could not read playlists.json:" + readErr));
        } else {
            modal.message.textContent = errors[0];
            modal.message.classList.add("error");
        }
    }

    removePlaylistFromModal() {
        const modal = this.modals.elements.top.confirmRemovePlaylist;
        const id = getPlaylistIdByName(this.playlists, modal.name.textContent);
        const playlist = this.playlists[id];

        const playlistsFile = path.join(this.mainFolder, "data", "playlists.json");
        fsp.readFile(playlistsFile, "utf8").then((data) => {
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
                    setTimeout(() => this.refresh(), 600);
                }, 1500);
            }).catch((writeErr) => this.error("ERROR HK-207 => Could not write playlists.json:" + writeErr));
        }).catch((readErr) => this.error("ERROR HK-106 => Could not read playlists.json:" + readErr));
    }
    
    renamePlaylistFromModal() {
        const modal = this.modals.elements.top.renamePlaylist;
        const id = getPlaylistIdByName(this.playlists, modal.name.textContent);
        const newName = modal.input.value;

        const errors = getPlaylistNameErrors(this.playlists, newName);
        if (errors.length == 0) {
            const playlistsFile = path.join(this.mainFolder, "data", "playlists.json");
            fsp.readFile(playlistsFile, "utf8").then((data) => {
                const jsonData = JSON.parse(data);
                jsonData[id].name = newName;

                fsp.writeFile(playlistsFile, JSON.stringify(jsonData, null, 2), "utf8").then(() => {
                    modal.message.textContent = `Playlist "${modal.name.textContent}" sucessfuly renamed ${newName}!`;
                    modal.message.classList.remove("error");
                    modal.message.classList.add("success");

                    setTimeout(() => {
                        this.modals.closeRenamePlaylistModal();
                        setTimeout(() => this.refresh(getPlaylistIdByName(this.playlists, this.currentPlaylist.name)), 600);
                    }, 1500);
                }).catch((writeErr) => this.error("ERROR HK-208 => Could not write playlists.json:" + writeErr));
            }).catch((readErr) => this.error("ERROR HK-107 => Could not read playlists.json:" + readErr));
        } else {
            modal.message.textContent = errors[0];
            modal.message.classList.add("error");
        }
    }

    addSongsToPlaylistFromModal() {
        const modal = this.modals.elements.top.addSongsToPlaylist;
        const pID = getPlaylistIdByName(this.playlists, modal.name.textContent);
        const songsToAdd = [...modal.container.querySelectorAll("ul > li")].filter((li) => li.querySelector("input").checked).map((li) => li.getAttribute("song-id"));
        this.addSongsToPlaylist(songsToAdd, pID, modal);
    }

    addSongsToPlaylist(sIDs, pID, modal) {
        if (sIDs.length > 0) {
            const playlistsFile = path.join(this.mainFolder, "data", "playlists.json");
            fsp.readFile(playlistsFile, "utf8").then((data) => {
                const jsonData = JSON.parse(data);
                sIDs.forEach((sID) => jsonData[pID].songs.push(parseInt(sID)));

                fsp.writeFile(playlistsFile, JSON.stringify(jsonData, null, 2), "utf8").then(() => {
                    if (modal) {
                        modal.message.textContent = `Songs added sucessfuly to the playlist!`;
                        modal.message.classList.remove("error");
                        modal.message.classList.add("success");
                    }

                    setTimeout(() => {
                        this.modals.closeAddSongsToPlaylistModal();
                        setTimeout(() => this.refresh((modal) ? pID : getPlaylistIdByName(this.playlists, this.currentPlaylist.name)), (modal) ? 600 : 0);
                    }, (modal) ? 1500 : 0);
                }).catch((writeErr) => this.error("ERROR HK-209 => Could not write playlists.json:" + writeErr));
            }).catch((readErr) => this.error("ERROR HK-108 => Could not read playlists.json:" + readErr));
        } 
    }

    removeSongFromPlaylistFromModal() {
        const modal = this.modals.elements.top.removeSongFromPlaylist;
        const sID = getSongIdByName(this.songs, modal.song.textContent);
        const pID = getPlaylistIdByName(this.playlists, modal.playlist.textContent);

        const playlistsFile = path.join(this.mainFolder, "data", "playlists.json");
        fsp.readFile(playlistsFile, "utf8").then((data) => {
            const jsonData = JSON.parse(data);
            jsonData[pID].songs.splice(jsonData[pID].songs.indexOf(sID), 1);

            fsp.writeFile(playlistsFile, JSON.stringify(jsonData, null, 2), "utf8").then(() => {
                modal.message.textContent = `Song "${modal.song.textContent}" from the playlist "${modal.playlist.textContent}"!`;
                modal.message.classList.remove("error");
                modal.message.classList.add("success");

                setTimeout(() => {
                    this.modals.closeRemoveSongFromPlaylistModal();
                    setTimeout(() => this.refresh(pID), 600);
                }, 1500);
            }).catch((writeErr) => this.error("ERROR HK-210 => Could not write playlists.json:" + writeErr));
        }).catch((readErr) => this.error("ERROR HK-109 => Could not read playlists.json:" + readErr));
    }

    movePlaylist(playlistID, parentID) {
        const playlistsFile = path.join(this.mainFolder, "data", "playlists.json");
        fsp.readFile(playlistsFile, "utf8").then((data) => {
            const jsonData = JSON.parse(data);
            jsonData[playlistID].parent = parentID;

            fsp.writeFile(playlistsFile, JSON.stringify(jsonData, null, 2), "utf8").then(() => {
                const cPlaylist = getPlaylistIdByName(this.playlists, this.currentPlaylist.name);
                this.refresh((cPlaylist != parentID) ? cPlaylist : null);
            }).catch((writeErr) => this.error("ERROR HK-211 => Could not write playlists.json:" + writeErr));
        }).catch((readErr) => this.error("ERROR HK-110 => Could not read playlists.json:" + readErr));
    }

    addSongToAppFromModal() {
        const modal = this.modals.elements.top.addSongToApp;
        const file = modal.file.files[0];
        const name = modal.name.value;
        const artist = modal.artist.value;

        modal.message.classList.remove("error");
        modal.message.textContent = "";

        const errors = getSongNameErrors(this.songs, name);
        if (artist == "") errors.push("Artist does not have a name");
        if (!file) errors.push("No file detected");
        else if (fs.existsSync(path.join(this.mainFolder, "songs", file.name))) errors.push("File already exists");

        if (errors.length == 0) {
            if (file) {
                const reader = new FileReader();
                const self = this;

                reader.onload = function(event) {
                    const fileContent = event.target.result;
                    ipcRenderer.send("save-song", { fileName: file.name, content: fileContent });
                    
                    ipcRenderer.once("song-saved", (e, success) => {
                        if (!success) return self.error("ERROR HK-212 => Could not write songs.json");

                        const songsFile = path.join(self.mainFolder, "data", "songs.json");
                        fsp.readFile(songsFile, "utf8").then((data) => {
                            const jsonData = JSON.parse(data);
                            self.settings.lastSongID++;
                            const id = self.settings.lastSongID;

                            jsonData[id] = {
                                name: name,
                                artist: artist,
                                src: file.name,
                            };

                            fsp.writeFile(songsFile, JSON.stringify(jsonData, null, 2), "utf8").then(() => {
                                modal.message.textContent = `Song "${name}" by "${artist}" successfuly added!`;
                                modal.message.classList.remove("error");
                                modal.message.classList.add("success");

                                setTimeout(() => {
                                    self.modals.closeAddSongToAppModal();
                                    setTimeout(() => self.refresh(getPlaylistIdByName(self.playlists, self.currentPlaylist.name)), 600);
                                }, 1500);
                            }).catch((writeErr) => self.error("ERROR HK-213 => Could not write songs.json:" + writeErr));
                        }).catch((readErr) => self.error("ERROR HK-111 => Could not read songs.json:" + readErr));
                    });
                };
                reader.readAsArrayBuffer(file);
            }
        } else {
            modal.message.textContent = errors[0];
            modal.message.classList.add("error");
            this.modals.closing = false;
        }
    }

    removeSongsFromAppFromModal() {
        const modal = this.modals.elements.top.removeSongsFromApp;
        const songsToRemove = [...modal.container.querySelectorAll("ul > li")].filter((li) => li.querySelector("input").checked).map((li) => parseInt(li.getAttribute("song-id")));

        const songsFile = path.join(this.mainFolder, "data", "songs.json");
        fsp.readFile(songsFile, "utf8").then((data) => {
            const jsonData = JSON.parse(data);
            songsToRemove.forEach((sID) => delete jsonData[sID]);

            fsp.writeFile(songsFile, JSON.stringify(jsonData, null, 2), "utf8").then(() => {
                const playlistsFile = path.join(this.mainFolder, "data", "playlists.json");

                fsp.readFile(playlistsFile, "utf8").then((data) => {
                    const jsonData2 = JSON.parse(data);
                    for (const pID in jsonData2) {
                        jsonData2[pID].songs.forEach((sID, index) => {
                            if (!songsToRemove.includes(parseInt(sID))) return;
                            jsonData2[pID].songs.splice(index, 1);
                        });
                    }
        
                    fsp.writeFile(playlistsFile, JSON.stringify(jsonData2, null, 2), "utf8").then(() => {
                        modal.message.textContent = "Songs successfuly removed from the app!";
                        modal.message.classList.remove("error");
                        modal.message.classList.add("success");

                        songsToRemove.forEach((sID) => {
                            const song = this.songs[sID];
                            if (!song) return;
                
                            const songPath = path.join(this.mainFolder, "songs", song.src);
                            if (fs.existsSync(songPath)) fsp.unlink(songPath, (err) => this.error("ERROR HK-302 => Could not remove song:" + err));
                        });
        
                        setTimeout(() => {
                            this.modals.closeRemoveSongsFromAppModal();
                            setTimeout(() => this.refresh(getPlaylistIdByName(this.playlists, this.currentPlaylist.name)), 600);
                        }, 1500);

                    }).catch((writeErr2) => this.error("ERROR HK-215 => Could not write playlists.json:" + writeErr2));
                }).catch((readErr2) => this.error("ERROR HK-113 => Could not read playlists.json:" + readErr2));
            }).catch((writeErr1) => this.error("ERROR HK-214 => Could not write songs.json:" + writeErr1));
        }).catch((readErr1) => this.error("ERROR HK-112 => Could not read songs.json:" + readErr1));
    }

    duplicatePlaylist(pID) {
        const playlistsFile = path.join(this.mainFolder, "data", "playlists.json");
        fsp.readFile(playlistsFile, "utf8").then((data) => {
            const jsonData = JSON.parse(data);
            const playlistToDuplicate = jsonData[pID];
            const id = (Object.keys(jsonData).length > 0) ? parseInt(Object.keys(jsonData).at(-1)) + 1 : 0;

            jsonData[id] = {
                name: playlistToDuplicate.name + " copy",
                thumbnail: playlistToDuplicate.thumbnail,
                songs: playlistToDuplicate.songs,
                parent: playlistToDuplicate.parent,
            };

            fsp.writeFile(playlistsFile, JSON.stringify(jsonData, null, 2), "utf8").then(() => {
                this.refresh(id);
            }).catch((writeErr) => this.error("ERROR HK-216 => Could not write playlists.json:" + writeErr));
        }).catch((readErr) => this.error("ERROR HK-114 => Could not read playlists.json:" + readErr));
    }

    editSongFromAppFromModal() {
        const modal = this.modals.elements.top.editSongFromApp;
        const sID = getSongIdByName(this.songs, modal.name.textContent);

        const songsFile = path.join(this.mainFolder, "data", "songs.json");
        fsp.readFile(songsFile, "utf8").then((data) => {
            const jsonData = JSON.parse(data);

            jsonData[sID].name = modal.nameInput.value;
            jsonData[sID].artist = modal.artistInput.value;

            fsp.writeFile(songsFile, JSON.stringify(jsonData, null, 2), "utf8").then(() => {
                modal.message.textContent = `Modification for "${modal.name.textContent}" has been saved!`;
                modal.message.classList.remove("error");
                modal.message.classList.add("success");

                setTimeout(() => {
                    this.modals.closeEditSongFromAppModal();
                    setTimeout(() => this.refresh(getPlaylistIdByName(this.playlists, this.currentPlaylist.name)), 600);
                }, 1500);
            }).catch((writeErr) => this.error("ERROR HK-217 => Could not write songs.json:" + writeErr));
        }).catch((readErr) => this.error("ERROR HK-116 => Could not read songs.json:" + readErr));
    }
};
