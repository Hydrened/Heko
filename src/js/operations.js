class Operations {
    // INIT
    constructor(app) {
        this.app = app;
    }

    // READ / WRITE
    async readJSON(file, errCode) {
        return fsp.readFile(file, "utf8").then((data) => {
            return JSON.parse(data);
        }).catch((error) => {
            this.app.error(`ERROR ${errCode} => Could not read ${file}: ${err}`);
            return null;
        });
    }

    async writeJSON(file, data, errCode) {
        return fsp.writeFile(file, JSON.stringify(data, null, 2), "utf8").catch(err => {
            this.app.error(`ERROR ${errCode} => Could not write ${file}: ${err}`);
        });
    }

    // EVENTS
    createPlaylist(name) {
        const playlistsFile = path.join(this.app.mainFolder, "data", "playlists.json");
        
        this.readJSON(playlistsFile, "HK-107").then((data) => {
            this.app.data.settings.lastPlaylistID += 1;
            const pID = this.app.data.settings.lastPlaylistID;

            this.app.data.settings.playlists[pID] = true;

            data[pID] = {
                name: name,
                thumbnail: "",
                songs: [],
                parent: null,
            };

            this.writeJSON(playlistsFile, data, "HK-205").then(() => {
                this.app.refresh([{ key: "p", value: pID }]);
            });
        });
    }

    removePlaylist(pID) {
        const playlistsFile = path.join(this.app.mainFolder, "data", "playlists.json");
        
        this.readJSON(playlistsFile, "HK-108").then((data) => {
            delete data[pID];

            for (const pIDc in data) {
                const p = data[pIDc];
                if (p.parent == pID) p.parent = null;
            }

            this.writeJSON(playlistsFile, data, "HK-208").then(() => {
                this.app.refresh();
            });
        });
    }

    renamePlaylist(pID, newName) {
        const playlistsFile = path.join(this.app.mainFolder, "data", "playlists.json");

        this.readJSON(playlistsFile, "HK-109").then((data) => {
            data[pID].name = newName;

            this.writeJSON(playlistsFile, data, "HK-209").then(() => {
                this.app.refresh();
            });
        });
    }
};
