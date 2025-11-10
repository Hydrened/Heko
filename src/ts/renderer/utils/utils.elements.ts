export const maintenanceContainer: Element = document.querySelector("maintenance-container")!;

export const playlists = {
    addButton: (document.querySelector("#add-playlist-button") as HTMLButtonElement),
    container: (document.querySelector("#playlists-container") as HTMLElement),
};

export const songs = {
    settingsButton: (document.querySelector("#song-settings-button") as HTMLButtonElement),
};

export const currentPlaylist = {
    container: (document.querySelector("#current-playlist-container") as HTMLElement),

    details: {
        thumbnail: (document.querySelector("#current-playlist-thumbnail") as HTMLElement),
        title: (document.querySelector("#current-playlist-title") as HTMLElement),
        songNumber: (document.querySelector("#current-playlist-song-number") as HTMLElement),
        duration: (document.querySelector("#current-playlist-duration") as HTMLElement),
    },

    addSongsButton: (document.querySelector("#add-songs-to-current-playlist-button") as HTMLButtonElement),

    songFilterInput: (document.querySelector("#current-playlist-song-filter-input") as HTMLInputElement),

    song: {
        sort: {
            idButton: (document.querySelector("#current-playlist-song-sort-by-id-button") as HTMLButtonElement),
            titleButton: (document.querySelector("#current-playlist-song-sort-by-title-button") as HTMLButtonElement),
            artistButton: (document.querySelector("#current-playlist-song-sort-by-artist-button") as HTMLButtonElement),
            durationButton: (document.querySelector("#current-playlist-song-sort-by-duration-button") as HTMLButtonElement),
        },

        container: (document.querySelector("#current-playlist-song-container") as HTMLElement),
    },

    merged: {
        sort: {
            idButton: (document.querySelector("#current-playlist-merged-sort-by-id-button") as HTMLButtonElement),
            nameButton: (document.querySelector("#current-playlist-merged-sort-by-name-button") as HTMLButtonElement),
            nbSongButton: (document.querySelector("#current-playlist-merged-sort-by-nb-song-button") as HTMLButtonElement),
            durationButton: (document.querySelector("#current-playlist-merged-sort-by-duration-button") as HTMLButtonElement),
        },

        container: (document.querySelector("#current-playlist-merged-container") as HTMLElement),
    },
};

export const account = {
    accountButton: (document.querySelector("#account-button") as HTMLButtonElement),
};

export const currentSong = {
    title: (document.querySelector("#current-song-title") as HTMLElement),
    artist: (document.querySelector("#current-song-artist") as HTMLElement),
};

export const songControls = {
    buttons: {
        toggleShuffleButton: (document.querySelector("#toggle-shuffle-button") as HTMLButtonElement),
        previousButton: (document.querySelector("#previous-song-button") as HTMLButtonElement),
        togglePlayButton: (document.querySelector("#toggle-play-button") as HTMLButtonElement),
        nextButton: (document.querySelector("#next-song-button") as HTMLButtonElement),
        toggleLoopButton: (document.querySelector("#toggle-loop-button") as HTMLButtonElement),
    },

    progressBar: {
        position: (document.querySelector("#current-song-position") as HTMLElement),
        slider: (document.querySelector("#song-position-slider") as HTMLInputElement),
        duration: (document.querySelector("#current-song-duration") as HTMLElement),
    },

    special: {
        pitchButton: (document.querySelector("#pitch-button") as HTMLButtonElement),
        queueButton: (document.querySelector("#queue-button") as HTMLButtonElement),
    },

    volume: {
        toggleButton: (document.querySelector("#toggle-song-volume-button") as HTMLButtonElement),
        slider: (document.querySelector("#volume-slider") as HTMLInputElement),
    },
};

export const settings = {
    container: (document.querySelector("settings-container") as HTMLElement),
    sectionContainer: (document.querySelector("#settings-section-container") as HTMLElement),

    account: {
        name: {
            text: (document.querySelector("#settings-user-name") as HTMLElement),
            editButton: (document.querySelector("#settings-edit-user-name") as HTMLButtonElement),
        },
        email: (document.querySelector("#settings-user-email") as HTMLElement),
        removeButton: (document.querySelector("#remove-account-button") as HTMLButtonElement),
    },

    apparence: {
        templateContainer: (document.querySelector("#settings-templates-container") as HTMLElement),
        mainColorInput: (document.querySelector("#settings-main-color") as HTMLInputElement),
        gradientColor1Input: (document.querySelector("#settings-gradient-color-1") as HTMLInputElement),
        gradientColor2Input: (document.querySelector("#settings-gradient-color-2") as HTMLInputElement),
        rotateGradientCheckbox: (document.querySelector("#settings-rotate-gradient") as HTMLInputElement),
        gradientRotationSpeedInput: (document.querySelector("#settings-gradient-rotation-speed") as HTMLInputElement),
        gradientDefaultRotationInput: (document.querySelector("#settings-gradient-default-rotation") as HTMLInputElement),
    },

    preferences: {
        hideSuccessModalCheckbox: (document.querySelector("#settings-hide-success-modal") as HTMLInputElement),
    },

    shortcuts: {

    }
};
