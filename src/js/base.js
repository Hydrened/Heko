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

                const strSaveData = JSON.stringify(app.settings, null, 2);
                fs.writeFile(settingsFile, strSaveData, (err) => {
                    if (err) console.error("ERROR HK-217 => Could not write settings.json:", err);
                });
            }).catch((readErr) => console.error("ERROR HK-116 => Could not read settings.json:" + readErr));
        });
    });
});
