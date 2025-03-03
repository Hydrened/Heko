class Modals {
    // INIT
    constructor(app) {
        this.app = app;

        this.initVariables();
        this.initEvents();
    }

    initVariables() {
        this.file = null;
    }

    initEvents() {
        function confirmModalEvents(m, name) {
            switch (name) {
                case "create-playlist": m.confirmCreatePlaylist(); break;
                case "confirm-remove-playlist": m.confirmRemovePlaylist(); break;
                case "rename-playlist": m.confirmRenamePlaylist(); break;
                case "add-song-to-app": m.confirmAddSongToApp(); break;
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
    }

    // EVENTS
    open(name, data) {
        const modal = [...document.querySelectorAll("[modal]")].filter((el) => el.getAttribute("modal") == name)[0];
        if (!modal) return;

        modal.classList.add("open");

        switch (name) {
            case "create-playlist": break;
            case "confirm-remove-playlist": this.initConfirmRemovePlaylist(data); break;
            case "rename-playlist": this.initRenamePlaylist(data); break;
            case "add-song-to-app": break;
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
