class SongListener {
    constructor(app) {
        this.app = app;
        this.songs = this.app.songs;
        this.playlists = this.app.playlists;
        this.mainFolder = this.app.mainFolder;

        this.elements = {
            audio: document.getElementById("audio"),
        };
        this.elements.audio.volume = 0;
        this.queue = null;
        this.currentPlaylist = null;
        this.lastError = "";

        this.handleEvents();
    }

    error(message) {
        this.app.error(message);
        this.lastError = message;
        setTimeout(() => {
            this.lastError = "";
        }, 10);
    }

    handleEvents() {
        this.elements.audio.addEventListener("ended", () => this.next());
    }
    
    resetQueue() {
        this.queue = this.currentPlaylist.songs.map((sID) => {
            return {
                id: sID,
                manuallyAdded: false,
            };
        });
    }

    shiftQueue(incr) {
        for (let i = 0; i < Math.abs(incr); i++) {
            if (incr > 0) this.queue.push(this.queue.shift());
            else this.queue.unshift(this.queue.pop());
        }
    }

    updateQueue(incr) {
        if (!this.app.settings.loop) {
            if (!this.app.settings.random) {
                if (this.queue) this.shiftQueue(incr);
                else this.resetQueue();

            } else {
                const randomID = this.currentPlaylist.songs[rand(0, this.currentPlaylist.songs.length - 1)];

                if (incr > 0) {
                    this.queue.shift();
                    this.queue.push({
                        id: randomID,
                        manuallyAdded: false,
                    });
                } else {
                    this.queue.pop();
                    this.queue.unshift({
                        id: randomID,
                        manuallyAdded: false,
                    });
                }
            }
        } else this.queue = this.currentPlaylist.songs.map(() => {
            return {
                id: (this.app.currentSondID == -1) ? 0 : this.app.currentSondID,
                manuallyAdded: false,
            };
        });
    }

    play() {
        const audio = this.elements.audio;

        if (this.app.currentSondID == -1) {
            this.playNextQueueSong();
        } else {
            if (this.isPaused()) audio.play();
            else audio.pause();
        }
    }

    previous() {
        const audio = this.elements.audio;

        if (audio.currentTime < 5) this.playPreviousQueueSong();
        else audio.currentTime = 0;
    }

    next() {
        this.playNextQueueSong();
    }

    random() {
        this.app.settings.random = !this.app.settings.random;
        if (this.app.settings.random) this.queue = this.currentPlaylist.songs.map(() => {
            return {
                id: this.currentPlaylist.songs[rand(0, this.currentPlaylist.songs.length - 1)],
                manuallyAdded: false,
            };
        }); else this.resetQueue();
    }

    loop() {
        this.app.settings.loop = !this.app.settings.loop;
        if (this.app.settings.loop) this.updateQueue();
        else {
            this.resetQueue();
            this.shiftQueue(this.currentPlaylist.songs.indexOf(this.app.currentSondID) + 1);
        }
    }

    addToQueue(sID) {
        this.queue.unshift({ id: sID, manuallyAdded: true });
    }

    playNextQueueSong() {
        if (this.queue.length == 0) return;
        this.playSong(this.queue[0].id);

        if (this.queue[0].manuallyAdded) this.queue.shift();
        else this.updateQueue(1);
    }

    playPreviousQueueSong() {
        this.updateQueue(-1);
        this.playSong(this.queue.at(-1).id);
    }

    playSong(id) {
        const song = this.songs[id];

        if (song) {
            if (fs.existsSync(path.join(this.mainFolder, "songs", song.src))) {
                const audio = this.elements.audio;
                audio.src = `${this.mainFolder}/songs/${song.src}`;
                audio.play();
                this.app.currentSondID = id;
            } else this.error(`File "${song.src}" is missing`);
        } else this.error(`Song ID "${id}" not found`);
    }

    isPaused() {
        return audio.paused;
    }

    getError() {
        return this.lastError;
    }

    getCurrentSongDuration() {
        return this.elements.audio.duration;
    }

    getCurrentSongCurrentTime() {
        return this.elements.audio.currentTime;
    }

    getCurrentPlaylist() {
        return this.currentPlaylist;
    }

    setVolume(volume) {
        this.elements.audio.volume = volume;
    }

    setCurrentTime(time) {
        this.elements.audio.currentTime = time;
    }

    setCurrentPlaylist(playlist) {
        this.currentPlaylist = playlist;
        this.resetQueue();
        this.updateQueue(0);
    }
};
