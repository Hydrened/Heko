const { ipcRenderer } = require("electron");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");

window.addEventListener("load", () => {
    const frame = new Frame();

    ipcRenderer.send("get-main-folder");
    ipcRenderer.on("send-main-folder", (e, mainFolder) => {
        const app = new App(mainFolder.replaceAll("\\", "/"));
    });
});
