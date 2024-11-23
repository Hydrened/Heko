const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

class Application {
    constructor() {
        this.window = this.createWindow();
        this.initMainFolder();
        this.handleEvents();
    }

    handleEvents() {
        ipcMain.on("window-minimize", () => this.window.minimize());
        ipcMain.on("window-maximize", () => (this.window.isMaximized()) ? this.window.unmaximize() : this.window.maximize());
        ipcMain.on("window-close", () => this.window.close());

        this.window.on("resize", () => {
            const { x, y, width, height } = this.window.getBounds();
            const f = this.window.isMaximized();
            this.window.webContents.send("window-update", { x, y, width, height, f });
        });

        this.window.on("move", () => {
            const { x, y, width, height } = this.window.getBounds();
            const f = this.window.isMaximized();
            this.window.webContents.send("window-update", { x, y, width, height, f });
        });

        ipcMain.on("get-main-folder", (e) => {
            e.reply("send-main-folder", path.join(app.getPath("documents"), "Heko"));
        });

        ipcMain.on("save-song", (e, { fileName, content }) => {
            fs.writeFile(path.join(path.join(app.getPath("documents"), "Heko"), "songs", fileName), Buffer.from(content), (err) => {
                if (err) console.error("ERROR HK-201 => Writing file in song folder:", err);
                e.reply("song-saved", (err) ? false : true);
            });
        });

        ipcMain.on("set-thumbnail-play-button", (e, data) => {
            this.thumbnailButtons[1].tooltip = data.slice(0, 1).toUpperCase() + data.slice(1);
            this.thumbnailButtons[1].icon = path.join(app.getAppPath(), "assets", "img", `${data}.png`),
            this.thumbnailButtons[1].click = () => {
                this.window.webContents.send("song-control", data);
            };
            this.window.setThumbarButtons(this.thumbnailButtons);
        });
    }

    createWindow() {
        const settingsFile = path.join(app.getPath("documents"), "Heko", "data", "settings.json");
        const jsonData = (fs.existsSync(settingsFile)) ? JSON.parse(fs.readFileSync(settingsFile, "utf8")) : null;

        const minW = 900;
        const minH = 650;

        const x = (jsonData) ? jsonData.window.x : 0;
        const y = (jsonData) ? jsonData.window.y : 0;
        const w = (jsonData) ? Math.max(jsonData.window.w, minW) : 1280;
        const h = (jsonData) ? Math.max(jsonData.window.h, minH) : 720;

        const window = new BrowserWindow({
            x: x,
            y: y,
            width: w,
            height: h,
            minWidth: minW,
            minHeight: minH,
            maxWidth: 1920,
            maxHeight: 1050,
            frame: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
        });
        window.setMenuBarVisibility(false);
        window.loadFile("src/index.html");
        if (jsonData) if (jsonData.window.f) window.maximize();

        

        this.thumbnailButtons = [
            {
                tooltip: "Previous",
                icon: path.join(app.getAppPath(), "assets", "img", "previous.png"),
                click: () => {
                    window.webContents.send("song-control", "previous");
                },
            },
            {
                tooltip: "Play",
                icon: path.join(app.getAppPath(), "assets", "img", "play.png"),
                click: () => {
                    window.webContents.send("song-control", "play");
                },
            },
            {
                tooltip: "Next",
                icon: path.join(app.getAppPath(), "assets", "img", "next.png"),
                click: () => {
                    window.webContents.send("song-control", "next");
                },
            }
        ];
        window.setThumbarButtons(this.thumbnailButtons);

        window.webContents.on("did-finish-load", () => {
            setTimeout(() => {
                const { x, y, width, height } = window.getBounds();
                const f = window.isMaximized();
                window.webContents.send("window-update", { x, y, width, height, f });
            }, 100);
        });

        return window;
    }
    
    initMainFolder() {
        const documents = app.getPath("documents");

        const mainFolder = path.join(documents, "Heko");
        if (!fs.existsSync(mainFolder)) fs.mkdirSync(mainFolder);
        
        const songsFolder = path.join(mainFolder, "songs");
        if (!fs.existsSync(songsFolder)) fs.mkdirSync(songsFolder);

        const thumbnailsFolder = path.join(mainFolder, "thumbnails");
        if (!fs.existsSync(thumbnailsFolder)) fs.mkdirSync(thumbnailsFolder);

        const dataFolder = path.join(mainFolder, "data");
        if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);

        const settingsFile = path.join(dataFolder, "settings.json");
        const saveData = {
            volume: 0.5,
            loop: false,
            random: false,
            window: {
                x: 0,
                y: 0,
                w: 1280,
                h: 720,
                f: false,
            },
            playlists: [],
            colors: {
                main: "rgb(31,114,198)",
            },
            lastSongID: 0,
        };
        const strSaveData = JSON.stringify(saveData, null, 2);
        if (!fs.existsSync(settingsFile)) fs.writeFile(settingsFile, strSaveData, (err) => {
            if (err) console.error("ERROR HK-202 => Could not write settings.json:", err);
        });

        const playlistsFile = path.join(dataFolder, "playlists.json");
        const playlistsData = {
            0: { name: "Likes", thumbnail: "", songs: [], parent: null },
        };
        const strPlaylistsData = JSON.stringify(playlistsData, null, 2);
        if (!fs.existsSync(playlistsFile)) fs.writeFile(playlistsFile, strPlaylistsData, (err) => {
            if (err) console.error("ERROR HK-203 => Could not write playlists.json:", err);
        });

        const songsFile = path.join(dataFolder, "songs.json");
        const songsData = {};
        const strSongstsData = JSON.stringify(songsData, null, 2);
        if (!fs.existsSync(songsFile)) fs.writeFile(songsFile, strSongstsData, (err) => {
            if (err) console.error("ERROR HK-204 => Could not write songs.json:", err);
        });

        const statsFile = path.join(dataFolder, "stats.json");
        const statsData = {};
        const strStatsData = JSON.stringify(statsData, null, 2);
        if (!fs.existsSync(statsFile)) fs.writeFile(statsFile, strStatsData, (err) => {
            if (err) console.error("ERROR HK-205 => Could not write stats.json:", err);
        });
    }
};


app.whenReady().then(() => {
    const applciation = new Application();
});

app.on("window-all-closed", () => {
    if (process.platform != "darwin") app.quit();
});
