const { ipcRenderer } = require("electron");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");

window.addEventListener("load", () => {
    const frame = new Frame();

    ipcRenderer.send("get-main-folder");
    ipcRenderer.on("send-main-folder", (e, mainFolder) => {
        const app = new App(mainFolder.replaceAll("\\", "/"));

        window.addEventListener("beforeunload", (e) => {
            const savesFile = path.join(app.mainFolder, "data", "saves.json");
            const saveData = {
                volume: app.elements.footer.volume.slider.value / 100,
                loop: app.settings.loop,
                random: app.settings.random,
                window: {
                    x: app.window.x,
                    y: app.window.y,
                    w: app.window.w,
                    h: app.window.h,
                },
                playlists: [],
            };
            const strSaveData = JSON.stringify(saveData, null, 2);
            fs.writeFile(savesFile, strSaveData, (err) => {
                if (err) console.error("Error writing json:", err);
            });
        });
    });
});
