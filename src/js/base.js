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
            const settingsFile = path.join(app.mainFolder, "data", "settings.json");
            fsp.readFile(settingsFile, "utf8").then((data) => {
                const jsonData = JSON.parse(data);

                if (app.settings.window.x < 0) app.settings.window.x = 0; 
                if (app.settings.window.y < 0) app.settings.window.y = 0; 

                const strSettingsData = JSON.stringify(app.settings, null, 2);
                fs.writeFile(settingsFile, strSettingsData, (err) => {
                    if (err) console.error("ERROR HK-217 => Could not write settings.json:", err);
                });

                const statsFile = path.join(app.mainFolder, "data", "stats.json");
                fsp.readFile(statsFile, "utf8").then((data) => {
                    const jsonData = JSON.parse(data);
                    
                    const strStatsData = JSON.stringify(app.stats, null, 2);
                    fs.writeFile(statsFile, strStatsData, (err) => {
                        if (err) console.error("ERROR HK-218 => Could not write stats.json:", err);
                    });
                }).catch((readErr2) => console.error("ERROR HK-119 => Could not read stats.json:" + readErr2));
            }).catch((readErr1) => console.error("ERROR HK-116 => Could not read settings.json:" + readErr1));
        });
    });
});
