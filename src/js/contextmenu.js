class Contextmenu {
    constructor(app) {
        this.app = app;
        this.container = null;

        this.menus = {
            "playlists-container-playlist": [
                { name: "Remove", call: null, children: [] },
                { name: "Rename", call: null, children: [] },
                { name: "Move to", call: null, children: [] },
            ],
            "playlists-container": [
                { name: "Create playlist", call: () => this.app.openCreatePlaylistModal(), children: [] },
            ],
        };
    }

    open(e, menu) {
        this.container = document.createElement("ul");
        this.container.classList.add("contextmenu");
        this.container.style.top = `${e.y}px`;
        this.container.style.left = `${e.x}px`;
        document.body.appendChild(this.container);

        this.menus[menu].forEach((line) => {
            const li = document.createElement("li");
            li.textContent = line.name;
            this.container.appendChild(li);

            if (line.call) li.addEventListener("click", () => line.call());
        });
    }

    close() {
        if (!this.container) return;
        this.container.remove();
        this.container = null;
    }
};
