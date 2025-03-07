class Modals {
    // INIT
    constructor(app) {
        this.app = app;

        this.initVariables();
        this.initEvents();
    }

    initVariables() {
        this.file = null;
        this.tabPos = 0;
    }

    initEvents() {
        function confirmModalEvents(m, name) {
            switch (name) {
                case "create-playlist": m.confirmCreatePlaylist(); break;
                case "confirm-remove-playlist": m.confirmRemovePlaylist(); break;
                case "rename-playlist": m.confirmRenamePlaylist(); break;
                case "add-song-to-app": m.confirmAddSongToApp(); break;
                case "remove-songs-from-app": m.confirmRemoveSongsFromApp(); break;
                case "add-songs-to-playlist": m.confirmAddSongsToPlaylist(); break;
                case "remove-song-from-playlist": m.confirmRemoveSongFromPlaylist(); break;
                case "edit-song-from-app": m.confirmEditSongFromApp(); break;
                default: break;
            }
        }

        // KEYDOWN
        document.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "Enter": if (this.isAModalOpened()) confirmModalEvents(this, this.getCurrentModalName()); break;
                case "Escape": this.closeCurrent(); break;
                default: break;
            }

            if (this.isAModalOpened() && e.key == "Tab") {
                const tabSensibleElements = [...this.getCurrentModal().querySelectorAll("input[type=text]")];
                this.tabPos += (e.shiftKey) ? -1 : 1;
                if (this.tabPos >= tabSensibleElements.length) this.tabPos = 0;
                if (this.tabPos < 0) this.tabPos = tabSensibleElements.length - 1;
                
                tabSensibleElements[this.tabPos].focus();
            }
        });

        // BUTTONS
        [...document.querySelectorAll("[modal]")].forEach((el) => {
            const button = el.querySelector("button.confirm");
            if (!button) return;

            button.addEventListener("click", () => {
                confirmModalEvents(this, el.getAttribute("modal"));
            });
        });

        [...document.querySelectorAll("[modal]")].forEach((el) => {
            [...el.querySelectorAll("button.error")].forEach((button) => {
                button.addEventListener("click", this.closeCurrent);
            });
        });

        // FILE TRANSFER
        const dragZone = document.getElementById("add-song-to-app-file");
        const fakeDragzone = document.getElementById("add-song-to-app-fake-drag-zone");

        document.addEventListener("dragenter", (e) => {
            if (!e.dataTransfer.types.includes("Files")) return;
            dragZone.classList.add("active");
        });

        document.addEventListener("dragleave", (e) => {
            if (e.relatedTarget != null) return;
            dragZone.classList.remove("active");
        });

        fakeDragzone.addEventListener("click", () => dragZone.click());

        dragZone.addEventListener("change", (e) => {
            this.resetMessages();
            dragZone.classList.remove("active");
            fakeDragzone.classList.remove("contains-file");
            fakeDragzone.textContent = "Drag a file";

            const file = e.target.files[0];
            if (!file) return;

            const errors = [];

            if (e.target.files[0].type == "audio/mpeg") {
                fakeDragzone.textContent = e.target.files[0].name;
                fakeDragzone.classList.add("contains-file");
            } else errors.push("File has to be a song format");

            if (fs.existsSync(path.join(this.app.mainFolder, "songs", file.name))) errors.push(`Song "${file.name}" already exists in songs folder`);

            if (errors.length > 0) {
                this.displayErrors(errors);
                e.preventDefault();
                fakeDragzone.textContent = "Drag a file";
                fakeDragzone.classList.remove("contains-file");
                dragZone.classList.remove("active");
            }
            dragZone.addEventListener("drop", () => dragZone.dispatchEvent(new Event("change")));
        });

        // ADD SONGS TO PLAYLIST
        const addSongToPlaylistSearchInput = document.getElementById("add-songs-to-playlist-input");
        addSongToPlaylistSearchInput.addEventListener("input", (e) => {
            [...this.getCurrentModal().querySelectorAll("li[song-id]")].forEach((li) => {
                const song = this.app.data.songs[parseInt(li.getAttribute("song-id"))];
                li.classList.remove("hidden");
                if (![song.name.toLowerCase(), song.artist.toLowerCase()].some((v) => v.includes(e.target.value.toLowerCase()))) li.classList.add("hidden");
            });
        });

        // REMOVE SONG FROM APP
        const removeSongFromAppSearchInput = document.getElementById("remove-songs-from-app-input");
        removeSongFromAppSearchInput.addEventListener("input", (e) => {
            [...this.getCurrentModal().querySelectorAll("li[song-id]")].forEach((li) => {
                const song = this.app.data.songs[parseInt(li.getAttribute("song-id"))];
                li.classList.remove("hidden");
                if (![song.name.toLowerCase(), song.artist.toLowerCase()].some((v) => v.includes(e.target.value.toLowerCase()))) li.classList.add("hidden");
            });
        });
    }

    // EVENTS
    open(name, data) {
        const modal = [...document.querySelectorAll("[modal]")].filter((el) => el.getAttribute("modal") == name)[0];
        if (!modal) return;
        
        this.tabPos = 0;
        this.app.contextmenu.close();
        modal.classList.add("open");

        switch (name) {
            case "create-playlist": break;
            case "confirm-remove-playlist": this.initConfirmRemovePlaylist(data); break;
            case "rename-playlist": this.initRenamePlaylist(data); break;
            case "add-song-to-app": break;
            case "remove-songs-from-app": this.initRemoveSongsFromApp(data); break;
            case "add-songs-to-playlist": this.initAddSongsToPlaylist(data); break;
            case "remove-song-from-playlist": this.initRemoveSongFromPlatlist(data); break;
            case "edit-song-from-app": this.initEditSongFromApp(data); break;
            default: break;
        }

        const textInputs = [...modal.querySelectorAll("input")].filter((i) => i.type == "text");
        if (textInputs.length > 0) textInputs[0].focus();
    }

    closeCurrent() {
        [...document.querySelectorAll("[modal]")].forEach((el) => {
            el.classList.remove("open");
            el.classList.add("closing");

            setTimeout(() => {
                [...el.querySelectorAll("input")].forEach((input) => {
                    switch (input.type) {
                        case "text": input.value = ""; break;
                        case "file": input.value = ""; break;
                        case "checkbox": input.checked = false; break;
                        default: break;
                    }
                });

                [...el.querySelectorAll("span")].forEach((span) => span.textContent = "");
                el.classList.remove("closing");
            }, 500);
        });
        this.tabPos = 0;
    }

    displayErrors(errors) {
        const el = this.getCurrentModal().querySelector("p.message");
        el.textContent = "";
        el.classList.remove("success");
        el.classList.add("error");

        errors.forEach((error, index) => {
            el.textContent += error;
            if (index != errors.length - 1) el.textContent += "\n";
        });
    }

    displaySucess(message) {
        const el = this.getCurrentModal().querySelector("p.message");
        el.classList.remove("error");
        el.classList.add("success");
        el.textContent = message;
    }

    resetMessages() {
        const el = this.getCurrentModal().querySelector("p.message");
        el.textContent = "";
        el.classList.remove("error");
        el.classList.remove("success");
    }

    // MODALS INIT
    initConfirmRemovePlaylist(data) {
        const playlist = this.app.data.playlists[data.pID];
        document.getElementById("confirm-remove-playlist-name").textContent = playlist.name;
    }

    initRenamePlaylist(data) {
        const playlist = this.app.data.playlists[data.pID];
        document.getElementById("rename-playlist-name").textContent = playlist.name;
        document.getElementById("rename-playlist-input").value = playlist.name;
    }

    initRemoveSongsFromApp(data) {
        const songContainer = document.getElementById("remove-songs-from-app-song-container");

        songContainer.innerHTML = "";

        for (const sID in data.songs) {
            const song = data.songs[sID];

            const li = document.createElement("li");
            li.setAttribute("song-id", sID);
            songContainer.appendChild(li);

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("no-pointer-events");
            li.appendChild(checkbox);

            const p = document.createElement("p");
            p.textContent = `${song.name} by ${song.artist}`;
            li.appendChild(p);

            li.addEventListener("click", () => checkbox.checked = !checkbox.checked);
        }
    }

    initAddSongsToPlaylist(data) {
        if (data.pID == null) return;

        const songContainer = document.getElementById("add-songs-to-playlist-song-container");
        const playlist = this.app.data.playlists[data.pID];
        const playlistSongs = playlist.songs;

        songContainer.innerHTML = "";
        document.getElementById("add-songs-to-playlist-name").textContent = playlist.name;

        Object.keys(this.app.data.songs).filter((sID) => !playlistSongs.includes(parseInt(sID))).forEach((sID) => {
            const song = this.app.data.songs[sID];

            const li = document.createElement("li");
            li.setAttribute("song-id", sID);
            songContainer.appendChild(li);

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("no-pointer-events");
            li.appendChild(checkbox);

            const p = document.createElement("p");
            p.textContent = `${song.name} by ${song.artist}`;
            li.appendChild(p);

            li.addEventListener("click", () => checkbox.checked = !checkbox.checked);
        });
    }

    initRemoveSongFromPlatlist(data) {
        document.getElementById("remove-song-from-playlist-song").textContent = this.app.data.songs[data.sID].name;
        document.getElementById("remove-song-from-playlist-song").setAttribute("song-id", data.sID);
        document.getElementById("remove-song-from-playlist-playlist").textContent = this.app.data.playlists[data.pID].name;
        document.getElementById("remove-song-from-playlist-playlist").setAttribute("playlist-id", data.pID);
    }

    initEditSongFromApp(data) {
        const song = this.app.data.songs[data.sID];
        document.getElementById("edit-song-from-app-name").textContent = song.name;
        document.getElementById("edit-song-from-app-name").setAttribute("song-id", data.sID);
        document.getElementById("edit-song-from-app-input-name").value = song.name;
        document.getElementById("edit-song-from-app-input-artist").value = song.artist;
    }

    // MODALS CONFIRM
    confirmCreatePlaylist() {
        const errors = [];

        const name = document.getElementById("create-playlist-modal-input").value;
        if (name == "") errors.push("Playlist does not have a name");
        if (this.app.playlists.map((p) => p.data.name).includes(name)) errors.push(`A playlist named "${name}" already exist.`);
        if (!this.areCharsValid(name)) errors.push(`Playlist name can't contain the characters [", /, \\].`);

        if (errors.length == 0) {
            this.app.operations.createPlaylist(name).then(() => {
                this.displaySucess(`Successfuly created playlist "${name}"`);
            });
        } else this.displayErrors(errors);
    }

    confirmRemovePlaylist() {
        const pName = document.getElementById("confirm-remove-playlist-name").textContent;
        const pID = this.app.getPlaylistByName(pName).data.id;
        this.app.operations.removePlaylist(pID).then(() => {
            this.displaySucess(`Successfuly removed playlist "${pName}"`);
        });
    }

    confirmRenamePlaylist() {
        const pName = document.getElementById("rename-playlist-name").textContent;
        const newName = document.getElementById("rename-playlist-input").value;
        const pID = this.app.getPlaylistByName(pName).data.id;
        this.app.operations.renamePlaylist(pID, newName).then(() => {
            this.displaySucess(`Successfuly renamed playlist "${pName}" to "${newName}"`);
        });
    }

    confirmAddSongToApp() {
        const errors = [];

        const name = document.getElementById("add-song-to-app-name").value;
        if (name == "") errors.push("Song name does not have a name");
        if (!this.areCharsValid(name)) errors.push(`Song name can't contain the characters [", /, \\].`);

        const artist = document.getElementById("add-song-to-app-artist").value;
        if (artist == "") errors.push("Song artist does not have a name");
        if (!this.areCharsValid(artist)) errors.push(`Song artist can't contain the characters [", /, \\].`);

        const files = document.getElementById("add-song-to-app-file").files;
        if (files.length == 0) errors.push("No file detected");
        const file = files[0];

        if (errors.length == 0) {
            this.app.operations.addSongToApp(name, artist, file).then(() => {
                this.displaySucess(`Song "${name}" by "${artist}" successfuly added!`);
            });
        } else this.displayErrors(errors);
    }

    confirmRemoveSongsFromApp() {
        const errors = [];
        const songsToRemove = [...this.getCurrentModal().querySelectorAll("li[song-id] > input[type=checkbox]")].filter((input) => input.checked).map((i) => parseInt(i.parentElement.getAttribute("song-id")));

        if (songsToRemove.length == 0) errors.push("No song(s) selected");

        if (errors.length == 0) {
            this.app.operations.removeSongsFromApp(songsToRemove).then(() => {
                this.displaySucess(`Song(s) successfuly removed!`);
            });
        } else this.displayErrors(errors);
    }

    confirmAddSongsToPlaylist() {
        const errors = [];
        const songsToAdd = [...this.getCurrentModal().querySelectorAll("li[song-id] > input[type=checkbox]")].filter((input) => input.checked).map((i) => parseInt(i.parentElement.getAttribute("song-id")));
        
        if (songsToAdd.length == 0) errors.push("No song(s) selected");
        
        if (errors.length == 0) {
            this.app.operations.addSongsToPlaylist(this.app.currentPlaylist.data.id, songsToAdd).then(() => {
                this.displaySucess(`Song(s) successfuly added to "${this.app.currentPlaylist.data.name}"`);
            });
        } else this.displayErrors(errors);
    }

    confirmRemoveSongFromPlaylist() {
        const sID = parseInt(document.getElementById("remove-song-from-playlist-song").getAttribute("song-id"));
        const song = this.app.data.songs[sID];
        const pID = parseInt(document.getElementById("remove-song-from-playlist-playlist").getAttribute("playlist-id"));
        const playlist = this.app.data.playlists[pID];

        this.app.operations.removeSongFromPlaylist(sID, pID).then(() => {
            this.displaySucess(`Successfuly removed song "${song.name}" from ${playlist.name}`);
        });
    }

    confirmEditSongFromApp() {
        const errors = [];

        const sID = parseInt(document.getElementById("edit-song-from-app-name").getAttribute("song-id"));

        const name = document.getElementById("edit-song-from-app-input-name").value;
        if (name == "") errors.push("Song name does not have a name");
        if (!this.areCharsValid(name)) errors.push(`Song name can't contain the characters [", /, \\].`);

        const artist = document.getElementById("edit-song-from-app-input-artist").value;
        if (artist == "") errors.push("Song artist does not have a name");
        if (!this.areCharsValid(artist)) errors.push(`Song artist can't contain the characters [", /, \\].`);

        if (errors.length == 0) {
            const song = this.app.data.songs[sID];
            this.app.operations.editSongFromApp(sID, name, artist).then(() => {
                this.displaySucess(`Modifications for "${song.name}" by "${song.artist}" has been saved`);
            });
        } else this.displayErrors(errors);
    }
 
    // GETTER
    isAModalOpened() {
        return [...document.querySelectorAll("[modal]")].filter((el) => el.classList.contains("open") || el.classList.contains("closing")).length > 0;
    }

    areCharsValid(str) {
        const forbiddenCharacters = ['"', "/", "\\"];
        return str.split("").every((c) => !forbiddenCharacters.includes(c));
    }

    getCurrentModal() {
        const openedModals = [...document.querySelectorAll(".modal.open")];
        if (openedModals.length == 1) return openedModals[0];
        else return null;
    }

    getCurrentModalName() {
        const currentModal = this.getCurrentModal();
        return (currentModal != null) ? currentModal.getAttribute("modal") : null;
    }
};
