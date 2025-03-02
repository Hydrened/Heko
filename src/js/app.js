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
        window.addEventListener("beforeunload", () => this.deconstructor());

        const aside = this.elements.aside;

        aside.createPlaylist.addEventListener("click", () => this.modals.open("create-playlist", null));

        [...aside.playlistsContainer.querySelectorAll("li.playlist")].forEach((li) => {
            const container = li.querySelector("div.container");
            const pID = li.getAttribute("playlist-id");

            container.addEventListener("contextmenu", (e) => {
                const menus = [
                    { name: "Rename playlist", call: () => this.modals.open("rename-playlist", { pID: pID }), children: [], shortcut: "F2" },
                    { name: "Remove playlist", call: () => this.modals.open("confirm-remove-playlist", { pID: pID }), children: [], shortcut: "Suppr" },
                    // { name: "Duplicate playlist", call: null, children: [], shortcut: "Ctrl+D" },
                    // { name: "Move to", call: null, children: [], shortcut: null },
                ];

                this.contextmenu.open(e, container, menus);
            });
        });
    }

    // CLEANUP
    deconstructor() {
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

    // GETTER
    getPlaylistByID(id) {
        const res = this.playlists.filter((p) => p.data.id == id);
        return (res.length != 1) ? null : res[0];
    }

    getPlaylistByName(name) {
        const res = this.playlists.filter((p) => p.data.name == name);
        return (res.length != 1) ? null : res[0];
    }
};
