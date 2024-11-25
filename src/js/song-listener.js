class SongListener {
    constructor(app) {
        this.app = app;
        this.songs = this.app.songs;
        this.playlists = this.app.playlists;
        this.mainFolder = this.app.mainFolder;

        this.audio = document.getElementById("audio");
        this.audio.volume = 0;

        this.queue = [];
        this.addedToQueue = [];
        this.currentPlaylist = null;
    
        this.handleEvents();
        this.initQueues();
    }

    handleEvents() {
        this.audio.addEventListener("ended", () => {
            const sID = this.getCurrentSongID();

            const ts = Date.now();
            if (this.app.stats[sID]) this.app.stats[sID].push(ts);
            else this.app.stats[sID] = [ts];

            this.playNextSong(1);
        });
        this.audio.addEventListener("error", (e) => {
            if (e.target.error) this.app.error("ERROR HK-303 => File not found");
        });
    }

    initQueues() {
        const params = new URLSearchParams(window.location.search);
        const jsonData = params.get("d");
            
        if (jsonData) {
            const d = JSON.parse(decodeURIComponent(jsonData));
            if (!d.playlist) return;
            if (!d.playlist.songs.includes(d.songID)) return;
            
            const songs = JSON.parse(fs.readFileSync(path.join(this.mainFolder, "data", "songs.json"), "utf8"));
            if (!songs[d.songID]) return;

            this.currentPlaylist = d.playlist;
            this.queue = d.queue;

            this.queue.unshift(d.songID);
            this.playNextSong(1);
            this.setSongCurrentTime(d.currentTime);
            this.queue.pop();
            
            const self = this;
            function autoPause() {
                setTimeout(() => {
                    self.app.elements.footer.buttons.pause.dispatchEvent(new Event("click"));
                    self.audio.removeEventListener("loadeddata", autoPause);
                }, 7);
            }

            if (d.isPaused) this.audio.addEventListener("loadeddata", autoPause);
            this.addedToQueue = d.addedToQueue;
        }
    }

    resetQueue(startIndex) {
        const random = this.app.settings.random;
        const loop = this.app.settings.loop;
        
        this.queue = [];
        if (this.currentPlaylist.songs.length == 0) return;

        if (loop) this.queue = [this.currentPlaylist.songs[startIndex]];

        else if (random) {
            this.queue = this.currentPlaylist.songs.map(() => {
                return this.currentPlaylist.songs[rand(0, this.currentPlaylist.songs.length - 1)];
            });
            this.queue[0] = this.currentPlaylist.songs[startIndex];

        } else {
            this.queue = [...this.currentPlaylist.songs];
            this.shiftQueue(startIndex);
        }
    }

    shiftQueue(incr) {
        if (this.app.settings.loop) return;
        for (let i = 0; i < Math.abs(incr); i++) {
            if (!this.app.settings.random) {
                if (incr > 0) this.queue.push(this.queue.shift());
                else if (incr < 0) this.queue.unshift(this.queue.pop());
            } else {
                const randSongID = this.currentPlaylist.songs[rand(0, this.currentPlaylist.songs.length - 1)];
                if (incr > 0) {
                    this.queue.shift();
                    this.queue.push(randSongID);
                } else if (incr < 0) {
                    this.queue.pop();
                    this.queue.unshift(randSongID);
                }
            }
        }
    }

    setCurrentPlaylist(playlist, startIndex, incr) {
        this.currentPlaylist = playlist;
        this.resetQueue(startIndex);
        this.playNextSong(incr);
    }

    playNextSong(incr) {
        if (this.queue.length == 0) return;
        if (incr > 1) incr = 1;
        else if (incr < -1) incr = -1;

        const sID = (this.addedToQueue.length == 0) ? this.queue.at((incr > 0) ? 0 : -1) : this.addedToQueue[0];

        if (this.addedToQueue.length != 0) this.addedToQueue.shift();
        else this.shiftQueue(incr);

        const song = this.songs[sID];
        this.audio.src = path.join(this.mainFolder, "songs", song.src);
        this.audio.setAttribute("song-id", sID);
        this.audio.play();
        
        this.app.elements.footer.buttons.pause.classList.remove("hidden");
        this.app.elements.footer.buttons.play.classList.add("hidden");
        ipcRenderer.send("set-thumbnail-play-button", "pause");
    }

    addToQueue(sID) {
        const song = this.songs[sID];
        if (song) {
            this.addedToQueue.push(parseInt(sID));
            this.app.success(`Added "${this.songs[sID].name}" to queue`);
        } else this.app.error(`Song ID "${sID}" is not valid`);
    }



    randomButton() {
        if (!this.currentPlaylist) return;
        const currentSid = this.getCurrentSongID();
        const currentSidIndex = this.currentPlaylist.songs.indexOf(currentSid);
        this.resetQueue(currentSidIndex + 1);
    }

    loopButton() {
        if (!this.currentPlaylist) return;
        const currentSid = this.getCurrentSongID();
        const currentSidIndex = this.currentPlaylist.songs.indexOf(currentSid) + ((this.app.settings.loop) ? 0 : 1);
        this.resetQueue(currentSidIndex);
    }

    playButton() {
        if (this.isSrcValid()) {
            if (this.isPaused()) this.audio.play();
            else this.audio.pause();    
        } else this.setCurrentPlaylist(this.app.currentPlaylist, 0, 1);
    }

    nextButton() {
        if (this.currentPlaylist) this.playNextSong(1);
        else this.setCurrentPlaylist(this.app.currentPlaylist, 0, 1);
    }

    previousButton() {
        if (this.currentPlaylist) {
            if (this.getCurrentSongCurrentTime() > 5) this.setSongCurrentTime(0);
            else this.playNextSong(-1);
        }
        else this.setCurrentPlaylist(this.app.currentPlaylist, 0, -1);
    }



    isPaused() {
        return this.audio.paused;
    }

    isSrcValid() {
        return this.audio.src != "";
    }



    getCurrentSongDuration() {
        return this.audio.duration;
    }

    getCurrentSongCurrentTime() {
        return this.audio.currentTime;
    }

    getCurrentSongID() {
        const sID = parseInt(this.audio.getAttribute("song-id"));
        return isNaN(sID) ? -1 : sID;
    }

    getCurrentData() {
        return {
            playlist: this.currentPlaylist,
            songID: this.getCurrentSongID(),
            currentTime: this.getCurrentSongCurrentTime(),
            duration: this.getCurrentSongDuration(),
            queue: this.queue,
            addedToQueue: this.addedToQueue,
            isPaused: this.isPaused(),
        };
    }



    setSongCurrentTime(time) {
        this.audio.currentTime = time;
    }

    setVolume(volume) {
        this.audio.volume = volume;
    }
};
