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
            this.app.error(`ERROR ${errCode} => Could not read ${file}: ${error}`);
            return null;
        });
    }

    async writeJSON(file, data, errCode) {
        return fsp.writeFile(file, JSON.stringify(data, null, 2), "utf8").catch((error) => {
            this.app.error(`ERROR ${errCode} => Could not write ${file}: ${error}`);
        });
    }

    // EVENTS
    async createPlaylist(name) {
        const playlistsFile = path.join(this.app.mainFolder, "data", "playlists.json");
        
        return this.readJSON(playlistsFile, "HK-107").then((data) => {
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

    async removePlaylist(pID) {
        const playlistsFile = path.join(this.app.mainFolder, "data", "playlists.json");

        return this.readJSON(playlistsFile, "HK-108").then((data) => {
            delete data[pID];

            for (const pIDc in data) {
                const p = data[pIDc];
                if (p.parent == pID) p.parent = null;
            }

            delete this.app.data.settings.playlists[pID]; // does not work

            this.writeJSON(playlistsFile, data, "HK-208").then(() => {
                this.app.refresh();
            });
        });
    }

    async renamePlaylist(pID, newName) {
        const playlistsFile = path.join(this.app.mainFolder, "data", "playlists.json");

        return this.readJSON(playlistsFile, "HK-109").then((data) => {
            data[pID].name = newName;

            this.writeJSON(playlistsFile, data, "HK-209").then(() => {
                this.app.refresh();
            });
        });
    }

    async duplicatePlaylist(pID) {
        const playlistsFile = path.join(this.app.mainFolder, "data", "playlists.json");

        return this.readJSON(playlistsFile, "HK-110").then((data) => {
            const playlistToDuplicate = data[pID];
            this.app.data.settings.lastPlaylistID += 1;
            const newID = this.app.data.settings.lastPlaylistID;

            data[newID] = {
                name: playlistToDuplicate.name + " copy",
                thumbnail: playlistToDuplicate.thumbnail,
                songs: playlistToDuplicate.songs,
                parent: playlistToDuplicate.parent,
            };

            this.writeJSON(playlistsFile, data, "HK-210").then(() => {
                this.app.refresh([{ key: "p", value: newID }]);
            });
        });
    }

    async movePlaylist(pID, pIDparent) {
        const playlistsFile = path.join(this.app.mainFolder, "data", "playlists.json");

        return this.readJSON(playlistsFile, "HK-111").then((data) => {
            data[pID].parent = pIDparent;

            this.writeJSON(playlistsFile, data, "HK-211").then(() => {
                this.app.refresh([{ key: "p", value: pID }]);
            });
        });
    }

    async addSongToApp(name, artist, file) {
        const songsFile = path.join(this.app.mainFolder, "data", "songs.json");
        const songsFolder = path.join(this.app.mainFolder, "songs");

        const self = this;
        const reader = new FileReader();

        reader.onload = async function (e) {
            const buffer = Buffer.from(e.target.result);
            const dest = path.join(songsFolder, file.name);

            try {
                await fsp.writeFile(dest, buffer);

                return self.readJSON(songsFile, "HK-112").then((data) => {
                    self.app.data.settings.lastSongID += 1;
                    const newID = self.app.data.settings.lastSongID;

                    data[newID] = {
                        name: name,
                        artist: artist,
                        src: file.name,
                    };

                    self.writeJSON(songsFile, data, "HK-212").then(() => {
                        self.app.refresh([{ key: "p", value: self.app.currentPlaylist.data.id }]);
                    });
                });

            } catch (error) {
                this.app.error(`ERROR HK-302 => Could not copy song file: ${error}`);
            }
        };

        reader.readAsArrayBuffer(file);
    }
};
