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
        const packageFile = path.join(__dirname, "..", "package.json");
        fsp.readFile(packageFile, "utf-8").then((data) => {
            const jsonData = JSON.parse(data);
            this.elements.title.textContent = `${jsonData.name} ${jsonData.version}`;
        }).catch((readErr) => console.error("Error => can't read package.json:" + readErr));
    }

    handleEvents() {
        const window = this.elements.window;

        this.elements.minimize.addEventListener("click", () => ipcRenderer.send("window-minimize"));
        this.elements.maximize.addEventListener("click", () => ipcRenderer.send("window-maximize"));
        this.elements.close.addEventListener("click", () => ipcRenderer.send("window-close"));
    }
};
