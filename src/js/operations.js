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
                this.app.refresh([{ key: "p", value: pID }]);
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

    async removeSongsFromApp(songs) {
        const songsFile = path.join(this.app.mainFolder, "data", "songs.json");
        const playlistsFile = path.join(this.app.mainFolder, "data", "playlists.json");

        await Promise.all(songs.map(async (sID) => {
            const song = this.app.data.songs[sID];
            const songPath = path.join(this.app.mainFolder, "songs", song.src);

            if (fs.existsSync(songPath)) {
                try {
                    await fs.promises.unlink(songPath);
                } catch (error) {
                    this.app.error(`ERROR HK-303 => Could not remove song file: ${error}`);
                }
            }

            const songsData = await this.readJSON(songsFile, "HK-113");
            delete songsData[sID];
            await this.writeJSON(songsFile, songsData, "HK-213");

            const playlistsData = await this.readJSON(playlistsFile, "HK-114");

            for (const pID in playlistsData) {
                const songIndex = playlistsData[pID].songs.indexOf(sID);
                if (songIndex !== -1) {
                    playlistsData[pID].songs.splice(songIndex, 1);
                }
            }

            await this.writeJSON(playlistsFile, playlistsData, "HK-214");
        }));

        this.app.refresh([{ key: "p", value: this.app.currentPlaylist.data.id }]);
    }

    async addSongsToPlaylist(pID, songs) {
        const playlistsFile = path.join(this.app.mainFolder, "data", "playlists.json");

        return this.readJSON(playlistsFile, "HK-115").then((data) => {
            data[pID].songs = data[pID].songs.concat(songs);

            this.writeJSON(playlistsFile, data, "HK-215").then(() => {
                this.app.refresh([{ key: "p", value: pID }]);
            });
        });
    }

    async removeSongFromPlaylist(sID, pID) {
        const playlistsFile = path.join(this.app.mainFolder, "data", "playlists.json");
        
        return this.readJSON(playlistsFile, "HK-116").then((data) => {
            data[pID].songs.splice(data[pID].songs.indexOf(sID), 1);

            this.writeJSON(playlistsFile, data, "HK-216").then(() => {
                this.app.refresh([{ key: "p", value: this.app.currentPlaylist.data.id }]);
            });
        });
    }

    async editSongFromApp(sID, name, artist) {
        const songsFile = path.join(this.app.mainFolder, "data", "songs.json");

        return this.readJSON(songsFile, "HK-117").then((data) => {

            data[sID].name = name;
            data[sID].artist = artist;

            this.writeJSON(songsFile, data, "HK-217").then(() => {
                this.app.refresh([{ key: "p", value: this.app.currentPlaylist.data.id }]);
            });
        });
    }
};
