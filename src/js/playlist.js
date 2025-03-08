class Playlist {
    // INIT
    constructor(app, data) {
        this.app = app;
        this.data = data;

        this.initVariables();
        this.initVisual();
    }

    initVariables() {
        this.elements = {
            visual: {
                container: null,
                title: null,
                content: null,
                childrenContainer: null,
                arrow: null,
            },
        };
    }

    initVisual() {
        const li = document.createElement("li");
        li.classList.add("playlist");
        li.setAttribute("playlist-id", this.data.id);
        
        if (this.data.parent == null) this.app.elements.aside.playlistsContainer.appendChild(li);
        else document.getElementById(`children-container-${this.data.parent}`).appendChild(li);

        this.elements.visual.container = document.createElement("div");
        this.elements.visual.container.classList.add("container");
        li.appendChild(this.elements.visual.container);
        
        const thumbnail = document.createElement("div");
        thumbnail.classList.add("thumbnail");
        if (this.data.thumbnail != "") thumbnail.style.backgroundImage = `url("${this.mainFolder}/thumbnails/${this.data.thumbnail}")`;
        this.elements.visual.container.appendChild(thumbnail);
    
        const details = document.createElement("div");
        details.classList.add("details");
        this.elements.visual.container.appendChild(details);
    
        this.elements.visual.title = document.createElement("h4");
        this.elements.visual.title.textContent = this.data.name;
        details.appendChild(this.elements.visual.title);
    
        this.elements.visual.content = document.createElement("h5");
        details.appendChild(this.elements.visual.content);
    
        this.elements.visual.childrenContainer = document.createElement("ul");
        this.elements.visual.childrenContainer.classList.add("children-container");
        if (this.app.data.settings.playlists[this.data.id]) this.elements.visual.childrenContainer.classList.add("show");
        this.elements.visual.childrenContainer.id = `children-container-${this.data.id}`;
        li.appendChild(this.elements.visual.childrenContainer);
    }

    initContent() {
        const visual = this.elements.visual;
        const nbSubPlaylist = visual.childrenContainer.children.length;

        if (nbSubPlaylist != 0) {
            visual.arrow = document.createElement("p");
            visual.arrow.classList.add("arrow");
            if (!this.app.data.settings.playlists[this.data.id]) visual.arrow.classList.add("show");
            visual.arrow.textContent = ">";
            visual.container.appendChild(visual.arrow);
            visual.content.textContent = `${nbSubPlaylist} playlist${(nbSubPlaylist < 2) ? "" : "s"}`;

        } else {
            const nbSongs = this.data.songs.length;
            visual.content.textContent = `${nbSongs} song${(nbSongs < 2) ? "" : "s"}`;
        }
        
        visual.container.addEventListener("click", () => {
            if (nbSubPlaylist != 0) {
                visual.childrenContainer.classList.toggle("show");
                visual.arrow.classList.toggle("show");
            } else this.open(false);
        });
    }

    // EVENTS
    open(instant) {
        const appCPE = this.app.elements.currentPlaylist;
        if (this.app.currentPlaylist == this) return;

        appCPE.container.classList.remove("open");
        this.app.currentPlaylist = this;

        setTimeout(() => {
            if (instant) {
                appCPE.container.style.transition = "0ms";
                appCPE.table.style.transition = "0ms";
            }

            appCPE.container.classList.add("open");
            appCPE.songContainer.innerHTML = "";
            appCPE.filter.value = "";
            appCPE.duration.textContent = "";

            if (instant) setTimeout(() => {
                appCPE.container.style.transition = "";
                appCPE.table.style.transition = "";
            }, 1);

            appCPE.title.textContent = this.data.name;
            appCPE.nbSong.textContent = `${this.data.songs.length} songs`;
            if (this.data.songs.length < 2) appCPE.nbSong.textContent = appCPE.nbSong.textContent.slice(0, -1);

            this.data.songs.forEach((sID, index) => {
                const song = this.app.data.songs[sID];
                if (!song) return;

                const songPath = path.join(this.app.mainFolder, "songs", song.src);
                
                const li = document.createElement("li");
                li.setAttribute("song-id", sID);
                appCPE.songContainer.appendChild(li);

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

                if (fs.existsSync(songPath)) {
                    const audio = new Audio(songPath);

                    audio.addEventListener("error", (e) => {
                        if (!e.target.error) return;
                        li.classList.add("error");
                    });

                    audio.addEventListener("loadedmetadata", () => {
                        duration.textContent = formatTime(parseInt(audio.duration));

                        const act = (appCPE.duration.textContent == "") ? 0 : parseDuration(appCPE.duration.textContent);
                        appCPE.duration.textContent = formatTime(act + parseInt(audio.duration));
                    });
                    li.addEventListener("click", () => this.app.listener.clickOnSong(sID));

                } else li.classList.add("error");
            });

            this.app.sortCurrentPlaylistBy("id");
            this.app.diplayCurrentSongPlaying();

        }, instant ? 0 : 600);
    }
};
