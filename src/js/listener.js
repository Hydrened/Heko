class Listener {
    // INIT
    constructor(app) {
        this.app = app;

        this.initVariables();
        this.initLoadedSettings();
        this.initEvents();
        this.update();
    }

    initVariables() {
        this.audio = document.getElementById("audio");

        this.currentPlaylist = null;
        this.currentSong = null;

        this.queue = [];
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

        document.addEventListener("keydown", (e) => {
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
    update() {
        this.updateSongSlider();
        this.updateSongCurrentTime();
        setTimeout(() => this.update(), 1000 / 30);
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
            this.listen(this.queue[0]);
            
            const shifted = this.queue.shift();
            const songs = this.currentPlaylist.data.songs;

            if (this.loop || !this.random) this.queue.push(shifted);
            else if (this.random) this.queue.push(songs[randomInRange(0, songs.length - 1)]);

            this.history.unshift(shifted);
        } else {
            this.historyPos = Math.max(0, this.historyPos - 1);
            this.listen(this.history[this.historyPos]);
        }
        this.displayPauseButton();
    }

    loopButton() {
        this.loop = !this.loop;
        this.app.elements.footer.center.buttons.loop.classList.toggle("activated");
        this.generateQueue(null);
    }

    clickOnSong(sID) {
        this.firstPlay(sID);
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
                songs.forEach(() => this.queue.push(songs[randomInRange(0, songs.length - 1)]));
                if (sID != null) this.queue[0] = sID;
            }

        } else {
            if (sID == null) {
                this.queue = (this.random) ? [songs[randomInRange(0, songs.length - 1)]] : [songs[0]];
            } else this.queue = [sID];
        }
    }

    listen(sID) {
        this.currentSong = this.app.data.songs[sID];
        const songPath = path.join(this.app.mainFolder, "songs", this.currentSong.src);

        this.audio.src = songPath;
        this.audio.setAttribute("song-id", sID);
        this.audio.play();

        const footer = this.app.elements.footer;
        footer.left.title.textContent = this.currentSong.name;
        footer.left.artist.textContent = this.currentSong.artist;
        document.querySelector("title").textContent = this.currentSong.name;

        this.audio.addEventListener("loadeddata", () => footer.center.song.duration.textContent = formatTime(parseInt(this.audio.duration)));
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

    incrSong(incr) {
        if (this.currentSong == null) return;

        const duration = this.audio.duration;
        const newCurrentTime = clamp(this.audio.currentTime + incr, 0, duration);
        this.setSongCurrentTime(newCurrentTime);
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
};
