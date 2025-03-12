const { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut } = require("electron");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

class Application {
    constructor() {
        this.window = this.createWindow();

        this.window.webContents.executeJavaScript("navigator.onLine").then((isOnline) => {
            if (isOnline) this.checkVersion();
        });

        this.initMainFolder();
        this.handleEvents();
    }

    handleEvents() {
        ipcMain.handle("get-main-folder", async (e) => {
            return path.join(app.getPath("documents"), "Heko").replaceAll("\\", "/");
        });

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

        ipcMain.on("window-minimize", () => this.window.minimize());
        ipcMain.on("window-maximize", () => (this.window.isMaximized()) ? this.window.unmaximize() : this.window.maximize());
        ipcMain.on("window-close", () => {
            this.window.close();
        });

        ipcMain.on("set-thumbnail-play-button", (e, data) => {
            this.thumbnailButtons[1].tooltip = data.slice(0, 1).toUpperCase() + data.slice(1);
            this.thumbnailButtons[1].icon = path.join(app.getAppPath(), "assets", "img", `${data}.png`),
            this.thumbnailButtons[1].click = () => {
                this.window.webContents.send("song-control", "play");
            };
            this.window.setThumbarButtons(this.thumbnailButtons);
        });
    }

    createWindow() {
        const gotTheLock = app.requestSingleInstanceLock();
        if (!gotTheLock) app.quit();

        const settingsFile = path.join(app.getPath("documents"), "Heko", "data", "settings.json");
        const jsonData = (fs.existsSync(settingsFile)) ? JSON.parse(fs.readFileSync(settingsFile, "utf8")) : null;

        const minW = 950;
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

        const backupsFolder = path.join(mainFolder, "backups");
        if (!fs.existsSync(backupsFolder)) fs.mkdirSync(backupsFolder);

        const settingsFile = path.join(dataFolder, "settings.json");
        const settingsData = {
            volume: 0.5,
            loop: false,
            random: false,
            window: {
                x: 0,
                y: 0,
                w: 1280,
                h: 720,
                f: true,
            },
            playlists: {},
            colors: {
                main: "rgb(31,114,198)",
            },
            lastSongID: 0,
            lastPlaylistID: 0,
        };
        const strSettingsData = JSON.stringify(settingsData, null, 2);
        if (!fs.existsSync(settingsFile)) fs.writeFile(settingsFile, strSettingsData, (err) => {
            if (err) console.error("ERROR HK-201 => Could not write settings.json:", err);
        });

        const playlistsFile = path.join(dataFolder, "playlists.json");
        const playlistsData = {
            0: { name: "Likes", thumbnail: "", songs: [], parent: null },
        };
        const strPlaylistsData = JSON.stringify(playlistsData, null, 2);
        if (!fs.existsSync(playlistsFile)) fs.writeFile(playlistsFile, strPlaylistsData, (err) => {
            if (err) console.error("ERROR HK-202 => Could not write playlists.json:", err);
        });

        const songsFile = path.join(dataFolder, "songs.json");
        const songsData = {};
        const strSongstsData = JSON.stringify(songsData, null, 2);
        if (!fs.existsSync(songsFile)) fs.writeFile(songsFile, strSongstsData, (err) => {
            if (err) console.error("ERROR HK-203 => Could not write songs.json:", err);
        });

        const statsFile = path.join(dataFolder, "stats.json");
        const statsData = {};
        const strStatsData = JSON.stringify(statsData, null, 2);
        if (!fs.existsSync(statsFile)) fs.writeFile(statsFile, strStatsData, (err) => {
            if (err) console.error("ERROR HK-204 => Could not write stats.json:", err);
        });
    }

    async checkVersion() {
        const url = "https://raw.githubusercontent.com/Hydrened/Heko/main/version";
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Error: statut : ${response.status}`);
            
            const latestVersion = await response.text();
            const currentVersion = fs.readFileSync(path.join(__dirname, "version"), "utf8");
            if (latestVersion == currentVersion || currentVersion.includes("b")) return;
            
            const res = dialog.showMessageBoxSync({
                type: "info",
                buttons: ["Update", "Ignore"],
                defaultId: 0,
                cancelId: 1,
                title: "Heko",
                message: "A new version is available",
            });
    
            if (res == 0) shell.openExternal(`https://raw.githubusercontent.com/Hydrened/Heko/main/dist/Heko%20Setup%20${latestVersion}.exe`);

        } catch (error) {
            dialog.showMessageBoxSync({
                type: "error",
                buttons: ["OK"],
                defaultId: 0,
                title: "Heko",
                message: "ERROR HK-301 => Could not read check version: " + error,
            });
        }
    }
};

app.whenReady().then(() => {
    const app = new Application();

    globalShortcut.register("MediaPlayPause", () => {
        app.window.webContents.send("song-control", "play");
    });

    globalShortcut.register("MediaNextTrack", () => {
        app.window.webContents.send("song-control", "next");
    });

    globalShortcut.register("MediaPreviousTrack", () => {
        app.window.webContents.send("song-control", "previous");
    });
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
    if (process.platform != "darwin") app.quit();
});
