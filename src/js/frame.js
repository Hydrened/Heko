class Frame {
    constructor() {
        this.elements = {
            title: document.getElementById("window-title"),
            minimize: document.getElementById("frame-minimize"),
            maximize: document.getElementById("frame-maximize"),
            close: document.getElementById("frame-close"),
        };

        this.initTitle();
        this.handleEvents();
    }

    initTitle() {
        const versionFile = path.join(__dirname, "..", "version");
        fsp.readFile(versionFile, "utf8").then((version) => {
            this.elements.title.textContent = `Heko ${version}`;
            this.elements.title.addEventListener("click", () => {
                const stringifiedVersion = version.replaceAll(".", "");
                shell.openExternal(`https://github.com/Hydrened/Heko/blob/main/CHANGES.md#heko-${stringifiedVersion}`);
            });
        }).catch((readErr) => console.error("ERROR HK-101 => Could not read version:" + readErr));
    }

    handleEvents() {
        this.elements.minimize.addEventListener("click", () => ipcRenderer.send("window-minimize"));
        this.elements.maximize.addEventListener("click", () => ipcRenderer.send("window-maximize"));
        this.elements.close.addEventListener("click", () => ipcRenderer.send("window-close"));
    }
};
