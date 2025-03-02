class Modals {
    // INIT
    constructor(app) {
        this.app = app;

        this.initEvents();
    }

    initEvents() {
        function confirmModalEvents(m, name) {
            switch (name) {
                case "create-playlist": m.confirmCreatePlaylist(); break;
                case "confirm-remove-playlist": m.confirmRemovePlaylist(); break;
                case "rename-playlist": m.confirmRenamePlaylist(); break;
                default: break;
            }
        }

        document.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "Enter": if (this.isAModalOpened()) confirmModalEvents(this, this.getCurrentModalName()); break;
                case "Escape": this.closeCurrent(); break;
                default: break;
            }
        });

        [...document.querySelectorAll("[modal]")].forEach((el) => {
            [...el.querySelectorAll("button.error")].forEach((button) => {
                button.addEventListener("click", this.closeCurrent);
            });
        });

        [...document.querySelectorAll("[modal]")].forEach((el) => {
            const button = el.querySelector("button.confirm");
            if (!button) return;

            button.addEventListener("click", () => {
                confirmModalEvents(this, el.getAttribute("modal"));
            });
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
            default: break;
        }

        const textInputs = [...modal.querySelectorAll("input")].filter((i) => i.type == "text");
        if (textInputs.length > 0) textInputs[0].focus();
    }

    closeCurrent() {
        [...document.querySelectorAll("[modal]")].forEach((el) => {
            el.classList.remove("open");

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

    // MODALS INIT
    initConfirmRemovePlaylist(data) {
        const playlist = this.app.data.playlists[data.pID];
        document.getElementById("confirm-remove-playlist-name").textContent = playlist.name;
    }

    initRenamePlaylist(data) {
        const playlist = this.app.data.playlists[data.pID];
        document.getElementById("rename-playlist-name").textContent = playlist.name;
    }

    // MODALS CONFIRM
    confirmCreatePlaylist() {
        const name = document.getElementById("create-playlist-modal-input").value;
        const errors = this.getPlaylistNameErrors(name);

        if (errors.length == 0) {
            this.app.operations.createPlaylist(name);
            this.displaySucess(`Successfuly created playlist "${name}"`);
        } else this.displayErrors(errors);
    }

    confirmRemovePlaylist() {
        const pName = document.getElementById("confirm-remove-playlist-name").textContent;
        const pID = this.app.getPlaylistByName(pName).data.id;
        this.displaySucess(`Successfuly removed playlist "${pName}"`);
        this.app.operations.removePlaylist(pID);
    }

    confirmRenamePlaylist() {
        const pName = document.getElementById("rename-playlist-name").textContent;
        const newName = document.getElementById("rename-playlist-input").value;
        const pID = this.app.getPlaylistByName(pName).data.id;
        this.displaySucess(`Successfuly renamed playlist "${pName}" to "${newName}"`);
        this.app.operations.renamePlaylist(pID, newName);
    }

    // GETTER
    isAModalOpened() {
        return [...document.querySelectorAll("[modal]")].filter((el) => el.classList.contains("open")).length > 0;
    }

    getPlaylistNameErrors(name) {
        const res = [];

        if (name == "") res.push("Playlist does not have a name");
        if (this.app.playlists.map((p) => p.data.name).includes(name)) res.push(`A playlist named "${name}" already exist.`);
        const forbiddenCharacters = ['"', "/", "\\"];
        if (name.split("").map((c) => forbiddenCharacters.includes(c)).includes(true)) res.push(`Playlist name can't contain the characters [", /, \\].`);

        return res;
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
