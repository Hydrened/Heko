const { ipcRenderer, shell } = require("electron");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");

window.addEventListener("load", () => {
    const frame = new Frame();

    ipcRenderer.send("get-main-folder");
    ipcRenderer.on("send-main-folder", (e, mainFolder) => {
        const app = new App(mainFolder.replaceAll("\\", "/"));

        window.addEventListener("beforeunload", (e) => {
            try {
                const settingsFile = path.join(app.mainFolder, "data", "settings.json");
                const settingsData = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
                if (app.settings.window.x < 0) app.settings.window.x = 0;
                if (app.settings.window.y < 0) app.settings.window.y = 0;
                const strSettingsData = JSON.stringify(app.settings, null, 2);
                fs.writeFileSync(settingsFile, strSettingsData, "utf8");
        
                const statsFile = path.join(app.mainFolder, "data", "stats.json");
                const statsData = JSON.parse(fs.readFileSync(statsFile, "utf8"));
                const strStatsData = JSON.stringify(app.stats, null, 2);
                fs.writeFileSync(statsFile, strStatsData, "utf8");
            } catch (err) {
                console.error("ERROR HK-304 => Could not save settings.json or stats.json:", err);
            }
        });
    });
});
