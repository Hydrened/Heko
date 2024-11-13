const { cpSync } = require("original-fs");

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
                playlistsContainer: document.getElementById("playlists-container"),
            },
            currentPlaylist: {
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
            },
            modal: {
                error: document.getElementById("error-modal"),
            },
        };

        this.currentPlaylist = null;
        this.currentSondID = -1;

        this.initData().then(() => {
            this.songListener = new SongListener(this);
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

        this.elements.modal.error.addEventListener("click", () => this.closeError());

        document.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });

        window.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "Tab": e.preventDefault(); break;
                case " ":
                    if (this.songListener.isPaused()) this.elements.footer.buttons.play.dispatchEvent(new Event("click"));
                    else this.elements.footer.buttons.pause.dispatchEvent(new Event("click"));
                    break;
                case "ArrowLeft": this.songListener.previous(); break;
                case "ArrowRight": this.songListener.next(); break;
                case "l": this.songListener.loop(); break;
                case "r": this.songListener.random(); break;
                case "q": this.songListener.setCurrentTime(151); break;
                default: break;
            }
        });
    }

    initData() {
        let volume = 0;
        const readSaves = fs.readFile(this.mainFolder + "/data/saves.json", "utf8").then(data => {
            const jsonData = JSON.parse(data);
            this.settings.loop = jsonData.loop;
            this.settings.random = jsonData.random;
            this.saves.volume = jsonData.volume;
        }).catch(err => console.error("Error reading saves.json:", err));

        const readSongs = fs.readFile(this.mainFolder + "/data/songs.json", "utf8").then(data => {
            this.songs = JSON.parse(data);
        }).catch(err => console.error("Error reading songs.json:", err));

        const readPlaylists = fs.readFile(this.mainFolder + "/data/playlists.json", "utf8").then(data => {
            this.playlists = JSON.parse(data);
        }).catch(err => console.error("Error reading playlists.json:", err));

        return Promise.all([readSaves, readSongs, readPlaylists]).then().catch(err => {
            console.error("Erreur lors de la lecture des fichiers :", err);
        });
    }

    initPlaylists() {
        const writtenPlaylistIDs = [];

        for (const strID in this.playlists) {
            const pID = parseInt(strID);
            const playlist = this.playlists[pID];

            let parent = playlist.parent;
            while (parent != null) {
                this.appendPlaylist(pID, playlist, parent);
                writtenPlaylistIDs.push(pID);
                parent = parent.parent;
            }

            if (writtenPlaylistIDs.includes(pID)) continue;
            this.appendPlaylist(pID, playlist, null);
            writtenPlaylistIDs.push(pID);
        }

        const writtenPlaylists = document.querySelectorAll("[playlist-id]");
        for (let i = 0; i < writtenPlaylists.length; i++) {
            const playlist = writtenPlaylists[i];
            const playlistContainer = playlist.querySelector("div");
            const childrenContainer = playlist.querySelector("ul");
            const nbSubPlaylist = childrenContainer.children.length;
            const pID = parseInt(playlist.getAttribute("playlist-id"));
            const content = playlist.querySelector("h5");

            if (nbSubPlaylist == 0) {
                const nbSongs = this.playlists[pID].songs.length;
                content.textContent = `${nbSongs} song${(nbSongs < 2) ? "" : "s"}`;
            } else content.textContent = `${nbSubPlaylist} playlist${(nbSubPlaylist < 2) ? "" : "s"}`;

            playlistContainer.addEventListener("click", () => {
                if (nbSubPlaylist == 0) this.openPlaylist(pID);
                else childrenContainer.classList.toggle("show");
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

            if (!isNaN(currentTime) && !isNaN(duration)) {
                this.elements.footer.song.position.textContent = formatTime(parseInt(currentTime));
                this.elements.footer.song.duration.textContent = formatTime(parseInt(duration));
                this.elements.footer.song.slider.value = currentTime / duration * 100;
            }
        }
        
        setTimeout(() => this.updateLoop(), 16.67);
    }

    appendPlaylist(id, playlist, parentID) {
        const li = document.createElement("li");
        li.classList.add("playlist");
        li.setAttribute("playlist-id", id);
        
        if (parentID == null) this.elements.aside.playlistsContainer.appendChild(li);
        else document.getElementById(`children-container-${parentID}`).appendChild(li);

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
    }

    async openPlaylist(id) {
        const playlist = this.playlists[id];

        if (playlist != this.currentPlaylist) {
            if (playlist) {
                this.currentPlaylist = playlist;
                this.elements.currentPlaylist.songContainer.innerHTML = "";

                if (playlist.thumbnail != "") {
                    try {
                        await fs.access(path.join(this.mainFolder, "thumbnails", playlist.thumbnail));
                        this.elements.currentPlaylist.thumbnail.style.backgroundImage = `url("${this.mainFolder}/thumbnails/${playlist.thumbnail}")`;
                    } catch (err) {
                        this.error(`Thumbnail "${playlist.thumbnail}" is missing`);
                    }
                } else this.elements.currentPlaylist.thumbnail.style.backgroundImage = "";

                this.elements.currentPlaylist.title.textContent = playlist.name;
                this.elements.currentPlaylist.nbSong.textContent = `${playlist.songs.length} songs`;
                if (playlist.songs.length < 2) this.elements.currentPlaylist.nbSong.textContent = this.elements.currentPlaylist.nbSong.textContent.slice(0, -1);

                playlist.songs.forEach((sID, index) => {
                    const song = this.songs[sID];

                    if (song) {
                        const li = document.createElement("li");
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
                            this.songListener.setCurrentPlaylist(playlist);
                            this.songListener.playSong(sID);
                        });
                    }
                });
            } else this.error(`Playlist ID "${id}" not found`);
        }
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

    getMainFolder() {
        return this.mainFolder;
    }

    getSongs() {
        return this.songs;
    }

    getPlaylists() {
        return this.playlists;
    }
};
