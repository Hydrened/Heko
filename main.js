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

        ipcMain.on("get-main-folder", (e) => {
            e.reply("send-main-folder", path.join(app.getPath("documents"), "Heko"));
        });
    }

    createWindow() {
        const window = new BrowserWindow({
            width: 1600,
            height: 900,
            minWidth: 900,
            minHeight: 650,
            frame: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
        });
        window.setMenuBarVisibility(false);
        window.loadFile("src/index.html");

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

        const savesFile = path.join(dataFolder, "saves.json");
        const saveData = {
            volume: 0.3,
            loop: false,
            random: false,
        };
        const strSaveData = JSON.stringify(saveData, null, 2);
        if (!fs.existsSync(savesFile)) fs.writeFile(savesFile, strSaveData, (err) => {
            if (err) console.error("Error writing json:", err);
        });

        const playlistsFile = path.join(dataFolder, "playlists.json");
        const playlistsData = {
            0: { name: "Likes", thumbnail: "", songs: [], parent: null },
        };
        const strPlaylistsData = JSON.stringify(playlistsData, null, 2);
        if (!fs.existsSync(playlistsFile)) fs.writeFile(playlistsFile, strPlaylistsData, (err) => {
            if (err) console.error("Error writing json:", err);
        });

        const songsFile = path.join(dataFolder, "songs.json");
        const songsData = {};
        const strSongstsData = JSON.stringify(songsData, null, 2);
        if (!fs.existsSync(songsFile)) fs.writeFile(songsFile, strSongstsData, (err) => {
            if (err) console.error("Error writing json:", err);
        });
    }
};


app.whenReady().then(() => {
    const applciation = new Application();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
