class Listener {
    // INIT
    constructor(app) {
        this.app = app;
        this.audio = document.getElementById("audio");

        this.currentPlaylist = null;
        this.currentSong = null;

        this.queue = [];
        this.history = [];
        this.historyPos = 0;

        this.random = false;
        this.loop = false;

        this.initLoadedSettings();
        this.initEvents();
        this.update();
    }

    initLoadedSettings() {
        setTimeout(() => {
            if (this.app.data.settings.random) this.randomButton();
            if (this.app.data.settings.loop) this.loopButton();
            this.audio.volume = this.app.data.settings.volume;
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

        this.app.elements.footer.center.song.slider.addEventListener("input", (e) => {
            if (this.currentSong == null) {
                this.app.elements.footer.center.song.slider.value = 0;
                return;
            }
            const percentage = e.target.value;
            const seconds = percentage / 100 * this.audio.duration;
            this.audio.currentTime = seconds;
        });
    }

    // CLEANUP
    deconstructor() {
        this.app.data.settings.random = this.random;
        this.app.data.settings.loop = this.loop;
        this.app.data.settings.volume = this.audio.volume;
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
            if (this.queue.length == 0) return;
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
                for (let i = 0; i < songs.indexOf(sID); i++) this.queue.push(this.queue.shift());
            } else songs.forEach(() => this.queue.push(songs[randomInRange(0, songs.length - 1)]));

        } else {
            const sID = parseInt(this.audio.getAttribute("song-id"));
            if (this.random) {
                if (sID == null) {
                    if (this.currentSong != null) this.queue = [sID];
                    else this.queue = [songs[randomInRange(0, songs.length - 1)]];
                }
            } else this.queue = (this.currentSong != null) ? [sID] : [songs[0]];
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
};
