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
            fsp.readFile(settingsFile, "utf-8").then((data) => {
                const jsonData = JSON.parse(data);

                const saveData = {
                    volume: app.elements.footer.volume.slider.value / 100,
                    loop: app.settings.loop,
                    random: app.settings.random,
                    window: {
                        x: Math.max(app.window.x, 0),
                        y: Math.max(app.window.y, 0),
                        w: app.window.w,
                        h: app.window.h,
                        f: app.window.f,
                    },
                    playlists: [],
                    colors: jsonData.colors,
                };
                const strSaveData = JSON.stringify(saveData, null, 2);
                fs.writeFile(settingsFile, strSaveData, (err) => {
                    if (err) console.error("Error writing json:", err);
                });
            }).catch((readErr) => console.error("Error => can't read songs.json:" + readErr));
        });
    });
});
