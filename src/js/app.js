class App {
    // INIT
    constructor() {
        this.initVariables();
        this.initFrame();
        this.initMainFolder().then(() => {
            this.initData().then(() => {
                this.initTooltip();
                this.initOperations();
                this.initModals();
                this.initContextMenu();
                this.initListener();
                this.initPlaylists();
                this.initEvents();
            });
        });
    }

    initVariables() {
        this.mainFolder = null;

        this.data = {
            settings: null,
            playlists: null,
            songs: null,
            stats: null,
        };

        this.playlists = [];
        this.currentPlaylist = null;
        this.sort = null;

        this.tooltip = null;
        this.operations = null;
        this.modals = null;
        this.contextmenu = null;
        this.listener = null;

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
                table: document.getElementById("current-playlist-table"),
                songContainer: document.getElementById("current-playlist-table-body"),
            },
            footer: {
                left: {
                    title: document.getElementById("current-song-name").querySelector("span"),
                    artist: document.getElementById("current-song-artist").querySelector("span"),
                },
                center: {
                    buttons: {
                        random: document.getElementById("random-button"),
                        previous: document.getElementById("previous-button"),
                        play: document.getElementById("play-button"),
                        pause: document.getElementById("pause-button"),
                        next: document.getElementById("next-button"),
                        loop: document.getElementById("loop-button"),
                    },
                    song: {
                        slider: document.getElementById("song-slider"),
                        duration: document.getElementById("song-duration"),
                        position: document.getElementById("song-position"),
                    },
                },
                right: {
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
            },
            success: document.getElementById("success-modal"),
            error: document.getElementById("error-modal"),
        };
    }

    initFrame() {
        new Frame();
    }

    async initMainFolder() {
        this.mainFolder = await ipcRenderer.invoke("get-main-folder");
    }

    async initData() {
        const readSettings = fsp.readFile(path.join(this.mainFolder, "data", "settings.json"), "utf8").then(data => {
            const jsonData = JSON.parse(data);
            this.data.settings = jsonData;

            const root = document.documentElement;
            root.style.setProperty("--col-1", jsonData.colors.main);
        }).catch(err => this.error("ERROR HK-102 => Could not read settings.json:", err));

        const readSongs = fsp.readFile(path.join(this.mainFolder, "data", "songs.json"), "utf8").then(data => {
            this.data.songs = JSON.parse(data);
        }).catch(err => this.error("ERROR HK-103 => Could not read songs.json:", err));

        const readPlaylists = fsp.readFile(path.join(this.mainFolder, "data", "playlists.json"), "utf8").then(data => {
            this.data.playlists = JSON.parse(data);
        }).catch(err => this.error("ERROR HK-104 => Could not read playlists.json:", err));

        const readStats = fsp.readFile(path.join(this.mainFolder, "data", "stats.json"), "utf8").then((data) => {
            this.data.stats = JSON.parse(data);
        }).catch(err => this.error("ERROR HK-105 => Could not read stats.json:", err));

        return Promise.all([readSettings, readSongs, readPlaylists]).then().catch(err => this.error("ERROR HK-106 => Could not read json files:", err));
    }

    initTooltip() {
        this.tooltip = new Tooltip();
    }

    initOperations() {
        this.operations = new Operations(this);
    }

    initModals() {
        this.modals = new Modals(this);
    }

    initContextMenu() {
        this.contextmenu = new Contextmenu(this);
    }

    initListener() {
        this.listener = new Listener(this);
    }

    initPlaylists() {
        sortPlaylistsByDependencies(this.data.playlists).forEach((playlistData) => {
            this.playlists.push(new Playlist(this, playlistData));
        });

        [...document.querySelectorAll("[playlist-id]")].forEach((playlistElement) => {
            const id = parseInt(playlistElement.getAttribute("playlist-id"));
            const playlist = this.getPlaylistByID(id);
            playlist.initContent();
        });

        const url = new URL(window.location.href);
        const params = url.searchParams;
        const paramP = params.get("p");
        const instant = params.get("instant") ? true : false;

        if (paramP != null) {
            const playlist = this.getPlaylistByID(parseInt(paramP));
            if (playlist) {
                playlist.open(true);
                return;
            }
        }

        const parentIds = new Set(this.playlists.filter((p) => p.data.parent != null).map((p) => p.data.parent));
        const firstValidPlaylist = this.playlists.filter((p) => !parentIds.has(p.data.id))[0];
        if (firstValidPlaylist) firstValidPlaylist.open(instant);
    }

    initEvents() {
        if (true) {
            window.addEventListener("beforeunload", () => this.deconstructor());

            document.addEventListener("keydown", (e) => {
                const curr = this.currentPlaylist;
                const currID = (curr) ? curr.data.id : -1;

                if (!this.modals.isAModalOpened()) switch (e.key) {
                    case "d": if (!e.altKey && e.ctrlKey) if (curr) this.operations.duplicatePlaylist(currID); break;
                    case "n":
                        if (e.altKey && e.ctrlKey) this.modals.open("create-playlist", null);
                        if (!e.altKey && e.ctrlKey) if (curr) this.modals.open("add-songs-to-playlist", { pID: currID });
                        break;
                    case "F2": if (!e.altKey && !e.ctrlKey) if (curr) this.modals.open("rename-playlist", { pID: currID }); break;
                    case "Delete": if (!e.altKey && !e.ctrlKey) if (curr) this.modals.open("confirm-remove-playlist", { pID: currID }); break;
                    default: break;
                }
            });

            ipcRenderer.on("window-update", (e, data) => {
                this.data.settings.window.x = data.x;
                this.data.settings.window.y = data.y;
                this.data.settings.window.w = data.width;
                this.data.settings.window.h = data.height;
                this.data.settings.window.f = data.f;
            });
        }

        const aside = this.elements.aside;
        if (aside) {
            aside.createPlaylist.addEventListener("click", () => this.modals.open("create-playlist", null));

            [...aside.playlistsContainer.querySelectorAll("li.playlist")].forEach((li) => {
                const container = li.querySelector("div.container");
                const pID = parseInt(li.getAttribute("playlist-id"));
                const thisP = this.data.playlists[pID];

                container.addEventListener("contextmenu", (e) => {
                    const removeSelf = this.playlists.filter((p) => p.data.id != pID);
                    const removeChildren = removeSelf.filter((p) => !this.isPlaylistChildOf(pID, p.data.id));
                    const removeParents = removeChildren.filter((p) => !this.isPlaylistChildOf(p.data.id, pID));

                    const possibleParents = removeParents.map((p) => {
                        return { name: p.data.name, call: () => this.operations.movePlaylist(pID, p.data.id), children: [], shortcut: null };
                    });
                    if (thisP.parent) possibleParents.unshift({ name: "Root", call: () => this.operations.movePlaylist(pID, null), children: [], shortcut: null });

                    const menus = [
                        { name: "Rename playlist", call: () => this.modals.open("rename-playlist", { pID: pID }), children: [], shortcut: "F2" },
                        { name: "Remove playlist", call: () => this.modals.open("confirm-remove-playlist", { pID: pID }), children: [], shortcut: "Suppr" },
                        { name: "Duplicate playlist", call: () => this.operations.duplicatePlaylist(pID), children: [], shortcut: "Ctrl+D" },
                        { name: "Move to", call: null, children: possibleParents, shortcut: null },
                    ];

                    this.contextmenu.open(e, container, menus);
                });
            });

            aside.playlistsContainer.addEventListener("contextmenu", (e) => {
                if (e.target.id != "playlists-container") return;
                const menus = [
                    { name: "Create playlist", call: () => this.modals.open("create-playlist", null), children: [], shortcut: "Ctrl+Alt+N" },
                ];

                this.contextmenu.open(e, null, menus);
            });

            aside.manageSongsButton.addEventListener("click", (e) => {
                setTimeout(() => {
                    const menus = [
                        { name: "Add song", call: () => this.modals.open("add-song-to-app", null), children: [], shortcut: "" },
                        { name: "Remove song", call: () => this.modals.open("remove-songs-from-app", { songs: this.data.songs }), children: [], shortcut: "" },
                    ];
                    const rect = document.querySelector("aside > footer").getBoundingClientRect();
                    this.contextmenu.open({ x: rect.x + rect.width, y: rect.y }, document.body, menus);
                }, 0);
            });
        }

        const currentP = this.elements.currentPlaylist;
        if (currentP) {
            currentP.addSong.addEventListener("click", () => this.modals.open("add-songs-to-playlist", { pID: (this.currentPlaylist) ? this.currentPlaylist.data.id : null }));

            currentP.filter.addEventListener("input", (e) => {
                [...currentP.songContainer.children].forEach((li) => {
                    const song = this.data.songs[parseInt(li.getAttribute("song-id"))];
                    li.classList.remove("hidden");
                    if (![song.name.toLowerCase(), song.artist.toLowerCase()].some((v) => v.includes(e.target.value.toLowerCase()))) li.classList.add("hidden");
                });
            });

            currentP.sort.id.addEventListener("click", () => (this.sort == "id") ? this.sortCurrentPlaylistBy("id-reverse") : this.sortCurrentPlaylistBy("id"));
            currentP.sort.title.addEventListener("click", () => (this.sort == "title") ? this.sortCurrentPlaylistBy("title-reverse") : this.sortCurrentPlaylistBy("title"));
            currentP.sort.artist.addEventListener("click", () => (this.sort == "artist") ? this.sortCurrentPlaylistBy("artist-reverse") : this.sortCurrentPlaylistBy("artist"));
            currentP.sort.duration.addEventListener("click", () => (this.sort == "duration") ? this.sortCurrentPlaylistBy("duration-reverse") : this.sortCurrentPlaylistBy("duration"));

            currentP.songContainer.addEventListener("contextmenu", (e) => {
                let hover = null;
                const menus = [];

                if (e.target.id == currentP.songContainer.id) {
                    menus.push({ name: "Add song to playlist", call: () => this.modals.open("add-songs-to-playlist", { pID: this.currentPlaylist.data.id }), children: [], shortcut: "Ctrl+N" });

                } else {
                    const li = e.target.parentElement;
                    const sID = parseInt(li.getAttribute("song-id"));
                    const pID = this.currentPlaylist.data.id;

                    const playlistsWhereCanBeAdded = this.playlists.filter((p) => !p.data.songs.includes(sID));
                    const addToOtherPlaylistChildren = playlistsWhereCanBeAdded.map((p) => {
                        return { name: p.data.name, call: () => this.operations.addSongsToPlaylist(p.data.id, [sID]), children: [], shortcut: null };
                    });

                    hover = li;
                    menus.push({ name: "Remove from playlist", call: () => this.modals.open("remove-song-from-playlist", { sID: sID, pID: pID }), children: [], shortcut: null });
                    menus.push({ name: "Add to other playlist", call: null, children: addToOtherPlaylistChildren, shortcut: null });
                    menus.push({ name: "Edit song", call: () => this.modals.open("edit-song-from-app", { sID: sID }), children: [], shortcut: null });
                }
                this.contextmenu.open(e, hover, menus);
            });
        }

        const footer = this.elements.footer;
        if (footer) {
            footer.center.buttons.random.addEventListener("click", () => this.listener.randomButton());
            footer.center.buttons.previous.addEventListener("click", () => this.listener.previousButton());
            footer.center.buttons.play.addEventListener("click", () => this.listener.playButton());
            footer.center.buttons.pause.addEventListener("click", () => this.listener.playButton());
            footer.center.buttons.next.addEventListener("click", () => this.listener.nextButton());
            footer.center.buttons.loop.addEventListener("click", () => this.listener.loopButton());
        }
    }

    // CLEANUP
    deconstructor() {
        this.listener.deconstructor();
        this.saveSettings();
        this.saveStats();
    }

    saveSettings() {
        try {
            const settingsFile = path.join(this.mainFolder, "data", "settings.json");
            const settingsData = JSON.parse(fs.readFileSync(settingsFile, "utf8"));

            [...this.elements.aside.playlistsContainer.querySelectorAll("li.playlist")].forEach((li) => {
                const id = parseInt(li.getAttribute("playlist-id"));
                this.data.settings.playlists[id] = li.querySelector("ul").classList.contains("show");
            });

            const strSettingsData = JSON.stringify(this.data.settings, null, 2);
            fs.writeFileSync(settingsFile, strSettingsData, "utf8");

        } catch (err) {
            this.error("ERROR HK-206 => Could not save settings.json", err);
        }
    }

    saveStats() {
        try {
            const statsFile = path.join(this.mainFolder, "data", "stats.json");
            const statsData = JSON.parse(fs.readFileSync(statsFile, "utf8"));
            const strStatsData = JSON.stringify(this.data.stats, null, 2);
            fs.writeFileSync(statsFile, strStatsData, "utf8");

        } catch (err) {
            this.error("ERROR HK-207 => Could not save stats.json", err);
        }
    }

    // INFOS
    success(message) {
        console.log(message);
    }

    error(message) {
        console.error(message);
    }

    // EVENTS
    refresh(params) {
        const strParams = (params) ? params.reduce((acc, param, index) => `${acc}${(index == 0) ? "?" : "&"}${param.key}=${param.value}`, "") : "";
        const link = "index.html" + strParams;
        window.location.href = link;
    }

    sortCurrentPlaylistBy(sortType) {
        if (this.currentPlaylist == null) return;

        this.sort = sortType;
        const reverse = this.sort.includes("reverse");
        const lis = [...this.elements.currentPlaylist.songContainer.children];
        const type = (reverse) ? this.sort.slice(0, this.sort.indexOf("-reverse")) : this.sort;

        for (const s in this.elements.currentPlaylist.sort) {
            const el = this.elements.currentPlaylist.sort[s];
            if (el.id.includes(type)) el.classList.add("sorted-by");
            else el.classList.remove("sorted-by");
        }

        function getText(element, index) {
            const el = element.querySelector(`p:nth-of-type(${index})`);
            return (el != null) ? el.textContent : "";
        }

        lis.sort((a, b) => {
            switch (type) {
                case "id": return parseInt(getText(a, 1)) - parseInt(getText(b, 1));
                case "title": return getText(a, 2).localeCompare(getText(b, 2));
                case "artist": return getText(a, 3).localeCompare(getText(b, 3));
                case "duration": return parseTime(getText(a, 4)) - parseTime(getText(b, 4));
                default: return 0;
            }
        });

        if (reverse) lis.reverse();
        
        lis.forEach((li) => this.elements.currentPlaylist.songContainer.appendChild(li));
    }

    // GETTER
    getPlaylistByID(id) {
        const res = this.playlists.filter((p) => p.data.id == id);
        return (res.length != 1) ? null : res[0];
    }

    getPlaylistByName(name) {
        const res = this.playlists.filter((p) => p.data.name == name);
        return (res.length != 1) ? null : res[0];
    }

    isPlaylistChildOf(pID, pIDparent) {
        let curP = this.getPlaylistByID(pID);

        let c = 0;
        while (curP && curP.data.parent != null && c < 1000) {
            if (curP.data.parent == pIDparent) return true;
            curP = this.getPlaylistByID(curP.data.parent);
            c++;
        }

        return false;
    }
};
