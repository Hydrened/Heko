class Listener {
    // INIT
    constructor(app) {
        this.app = app;

        this.initVariables();
        this.initLoadedSettings();
        this.initEvents();
        this.run();
    }

    initVariables() {
        this.audio = document.getElementById("audio");

        this.fps = 10;
        this.lastUpdate = performance.now();

        this.currentPlaylist = null;
        this.currentSong = null;
        this.currentSongTicks = 0;

        this.queue = [];
        this.priorityQueue = [];
        this.history = [];
        this.historyPos = 0;

        this.random = false;
        this.loop = false;

        this.oldVolume = null;
    }

    initLoadedSettings() {
        setTimeout(() => {
            if (this.app.data.settings.random) this.randomButton();
            if (this.app.data.settings.loop) this.loopButton();
            this.setVolume(this.app.data.settings.volume);
        }, 0);
    }

    initEvents() {
        this.audio.addEventListener("ended", () => {
            this.nextButton();
        });

        this.audio.addEventListener("error", (e) => {
            this.app.error(`ERROR HK-304 => ${e.target.error}`);
        });

        ipcRenderer.on("song-control", (e, data) => {
            switch (data) {
                case "play": this.playButton(); break;
                case "next": this.nextButton(); break;
                case "previous": this.previousButton(); break;
                default: break;
            }
        });

        ipcRenderer.on("show-media-data", (e, data) => {
            if (this.currentSong == null) {
                return;
            }
        });

        document.addEventListener("keydown", (e) => {
            if (this.app.modals.isAModalOpened()) return;
            if (this.app.isWritingInFilter()) return;

            switch (e.key.toLowerCase()) {
                case "m":
                    if (!e.ctrlKey && !e.shiftKey) {
                        const svgs = Object.values(this.app.elements.footer.right.volume.svg).filter((svg) => !svg.classList.contains("hidden"));
                        if (svgs.length != 1) break;
                        svgs[0].dispatchEvent(new Event("click"));
                    }
                    break;
                case "l": if (!e.ctrlKey && !e.shiftKey) this.loopButton(); break;
                case "r": if (!e.ctrlKey && !e.shiftKey) this.randomButton(); break;
                case " ": if (!e.ctrlKey && !e.shiftKey) this.playButton(); break;
                case "arrowleft":
                    if (e.ctrlKey && !e.shiftKey) this.previousButton();
                    else if (!e.ctrlKey && !e.shiftKey) this.incrSong(-5);
                    break;
                case "arrowright":
                    if (e.ctrlKey && !e.shiftKey) this.nextButton();
                    else if (!e.ctrlKey && !e.shiftKey) this.incrSong(5);
                    break;
                case "arrowup": this.incrVolume(5); break;
                case "arrowdown": this.incrVolume(-5); break;
                default: break;
            }

            if (isDigit(e.key) && this.currentSong != null) {
                const blend = parseInt(e.key) / 10;
                const time = this.audio.duration * blend;
                this.setSongCurrentTime(time);
            }
        });

        this.app.elements.footer.center.song.slider.addEventListener("input", (e) => {
            if (this.currentSong == null) {
                this.app.elements.footer.center.song.slider.value = 0;
                return;
            }
            const percentage = e.target.value;
            const seconds = percentage / 100 * this.audio.duration;
            this.audio.currentTime = seconds;
        });

        this.app.elements.footer.right.volume.slider.addEventListener("input", (e) => {
            this.setVolume(e.target.value / 100);
        });

        this.app.elements.footer.right.volume.svg.no.addEventListener("click", () => {
            this.setVolume(this.oldVolume / 100);
        });

        this.app.elements.footer.right.volume.svg.low.addEventListener("click", () => {
            this.oldVolume = this.app.elements.footer.right.volume.slider.value;
            this.setVolume(0);
        });

        this.app.elements.footer.right.volume.svg.high.addEventListener("click", () => {
            this.oldVolume = this.app.elements.footer.right.volume.slider.value;
            this.setVolume(0);
        });
    }

    // CLEANUP
    deconstructor() {
        this.app.data.settings.random = this.random;
        this.app.data.settings.loop = this.loop;
    }

    // UPDATE
    run() {
        setInterval(() => {
            this.update();
        }, 1000 / this.fps);
    }

    update() {
        this.updateSongSlider();
        this.updateSongCurrentTime();
        this.updateListened();
    }

    updateSongSlider() {
        if (this.currentSong == null) return;
        const percentage = this.audio.currentTime / this.audio.duration * 100;
        if (isNaN(percentage)) return;
        this.app.elements.footer.center.song.slider.value = percentage;
    }

    updateSongCurrentTime() {
        if (this.currentSong == null) return;
        this.app.elements.footer.center.song.position.textContent = formatTime(parseInt(this.audio.currentTime));
    }

    updateListened() {
        if (this.currentSong == null) return;
        if (this.audio.paused) return;
        if (this.audio.currentTime == 0) return;
        this.currentSongTicks++;
    }

    // BUTTON
    randomButton() {
        this.random = !this.random;
        this.app.elements.footer.center.buttons.random.classList.toggle("activated");
        this.generateQueue(null);
    }

    previousButton() {
        if (this.history.length == 0) return this.nextButton();

        if (this.currentSong != null) if (this.audio.currentTime >= 5) return this.setSongCurrentTime(0);

        this.historyPos = Math.min(this.historyPos + 1, this.history.length - 1);
        this.listen(this.history[this.historyPos]);
    }

    playButton() {
        if (this.currentSong != null) {
            if (this.audio.paused) {
                this.audio.play();
                this.displayPauseButton();
                
            } else {
                this.audio.pause();
                this.displayPlayButton();
            }

        } else this.firstPlay(null);
    }

    nextButton() {
        if (this.historyPos == 0) {
            if (this.queue.length == 0) return this.firstPlay(null);

            let shifted;

            if (this.priorityQueue.length > 0) {
                this.listen(this.priorityQueue[0]);
                shifted = this.priorityQueue.shift();

            } else {
                this.listen(this.queue[0]);
                
                shifted = this.queue.shift();
                const songs = this.currentPlaylist.data.songs;

                if (this.random && !this.loop) {
                    const possibleSongs = (songs.length != 1) ? songs.filter((sID) => sID != this.queue.at(-1)) : songs;
                    this.queue.push(possibleSongs[randomInRange(0, possibleSongs.length - 1)]);

                } else if (this.loop || this.random) this.queue.push(shifted);
            }

            this.history.unshift(shifted);

        } else {
            if (this.priorityQueue.length > 0) {
                this.listen(this.priorityQueue[0]);
                this.history.unshift(this.priorityQueue.shift());
                this.historyPos++;

            } else {
                this.historyPos = Math.max(0, this.historyPos - 1);
                this.listen(this.history[this.historyPos]);
            }
        }
        this.displayPauseButton();
    }

    loopButton() {
        this.loop = !this.loop;
        this.app.elements.footer.center.buttons.loop.classList.toggle("activated");
        if (this.loop) this.historyPos = 0;
        this.generateQueue(null);
    }

    // EVENTS
    firstPlay(sID) {
        this.generateQueue(sID);
        if (this.queue.length == 0) return;
        this.nextButton();
        this.displayPauseButton();
    }

    generateQueue(sID) {
        this.currentPlaylist = this.app.currentPlaylist;
        const songs = this.currentPlaylist.data.songs;
        this.queue = [];

        if (songs.length == 0) return;

        if (!this.loop) {
            if (!this.random) {
                this.queue = songs;
                const index = (sID == null) ? 0 : songs.indexOf(sID);
                this.queue = songs.slice(index).concat(songs.slice(0, index));

            } else {
                songs.forEach((s, index) => {
                    const possibleSongs = (songs.length != 1) ? songs.filter((sID) => sID != this.queue.at(-1)) : songs;
                    this.queue.push(possibleSongs[randomInRange(0, possibleSongs.length - 1)]);
                });

                if (sID != null) this.queue[0] = sID;
            }

        } else {
            if (sID == null) {
                const currentSID = parseInt(this.audio.getAttribute("song-id")) || 1;
                this.queue = [currentSID];
            } else this.queue = [sID];
        }
    }

    listen(sID) {
        this.incraseSongStat();

        this.currentSong = this.app.data.songs[sID];
        const songPath = path.join(this.app.mainFolder, "songs", this.currentSong.src);

        this.audio.src = songPath;
        this.audio.setAttribute("song-id", sID);
        this.audio.play();

        const footer = this.app.elements.footer;
        footer.left.title.textContent = this.currentSong.name;
        footer.left.artist.textContent = this.currentSong.artist;
        document.querySelector("title").textContent = this.currentSong.name;
        this.app.diplayCurrentSongPlaying();

        this.audio.addEventListener("loadeddata", () => footer.center.song.duration.textContent = formatTime(parseInt(this.audio.duration)));
    }

    clickOnSong(sID) {
        this.firstPlay(sID);
    }

    displayPlayButton() {
        this.app.elements.footer.center.buttons.play.classList.remove("hidden");
        this.app.elements.footer.center.buttons.pause.classList.add("hidden");
        ipcRenderer.send("set-thumbnail-play-button", "play");
    }

    displayPauseButton() {
        this.app.elements.footer.center.buttons.play.classList.add("hidden");
        this.app.elements.footer.center.buttons.pause.classList.remove("hidden");
        ipcRenderer.send("set-thumbnail-play-button", "pause");
    }

    addToQueue(sID) {
        if (this.currentSong != null) {
            this.priorityQueue.push(sID);
            this.app.success(`Added song "${this.app.data.songs[sID].name}" to queue`);
        } else this.app.error("Can't add a song to queue if queue is not initialized");
    }

    incraseSongStat() {
        if (this.currentSong == null) return;
        const currentSongTotalTicks = this.audio.duration * this.fps;
        const percentage = Math.round((this.currentSongTicks / currentSongTotalTicks) * 100);
        this.currentSongTicks = 0;

        if (percentage >= 75) {
            const sID = parseInt(this.audio.getAttribute("song-id"));
            if (this.app.data.stats[sID] == undefined) this.app.data.stats[sID] = [Date.now()];
            else this.app.data.stats[sID].push(Date.now());
        }
    }

    // SETTER
    setVolume(blend) {
        const volume = this.app.elements.footer.right.volume;
        const slider = volume.slider;
        const svg = volume.svg;
        slider.value = blend * 100;

        this.app.data.settings.volume = blend;
        blend = Math.min(Math.max(blend, 0), 1);
        this.audio.volume = Math.pow(blend, 2.0);

        svg.no.classList.add("hidden");
        svg.low.classList.add("hidden");
        svg.high.classList.add("hidden");

        const volumeCase = (slider.value == 0) ? "no-volume" : (slider.value < 50) ? "low-volume" : "high-volume";
        switch(volumeCase) {
            case "no-volume": svg.no.classList.remove("hidden"); break;
            case "low-volume": svg.low.classList.remove("hidden"); break;
            case "high-volume": svg.high.classList.remove("hidden"); break;
            default: break;
        }
    }

    setSongCurrentTime(time) {
        const slider = this.app.elements.footer.center.song.slider;

        const duration = this.audio.duration;
        const newCurrentTime = clamp(time, 0, duration);
        const percentage = newCurrentTime / duration * 100;

        slider.value = percentage;
        slider.dispatchEvent(new InputEvent("input"));
    }

    incrSong(incr) {
        if (this.currentSong == null) return;

        const duration = this.audio.duration;
        const newCurrentTime = clamp(this.audio.currentTime + incr, 0, duration);
        this.setSongCurrentTime(newCurrentTime);
    }

    incrVolume(incr) {
        this.setVolume((parseFloat(this.app.elements.footer.right.volume.slider.value) + incr) / 100);
    }
};
