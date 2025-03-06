const { ipcRenderer } = require("electron");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");

window.addEventListener("load", () => new App());
