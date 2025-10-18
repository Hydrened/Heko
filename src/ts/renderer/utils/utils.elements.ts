export const playlists = {
    addButton: document.querySelector("#add-playlist-button"),
    container: document.querySelector("#playlists-container"),
};

export const songs = {
    settingsButton: document.querySelector("#song-settings-button"),
};

export const currentPlaylist = {
    details: {
        thumbnail: document.querySelector("#current-playlist-thumbnail"),
        title: document.querySelector("#current-playlist-title"),
        songNumber: document.querySelector("#current-playlist-song-number"),
        duration: document.querySelector("#current-playlist-duration"),
    },

    addSongsButton: document.querySelector("#add-songs-to-current-playlist-button"),

    songFilterInput: document.querySelector("#current-playlist-song-filter-input"),

    sort: {
        idButton: document.querySelector("#current-playlist-sort-by-id-button"),
        titleButton: document.querySelector("#current-playlist-sort-by-title-button"),
        artistButton: document.querySelector("#current-playlist-sort-by-artist-button"),
        durationButton: document.querySelector("#current-playlist-sort-by-duration-button"),
    },

    songContainer: document.querySelector("#current-playlist-song-container"),
};

export const account = {
    logoutButton: document.querySelector("#logout-button"),
};

export const currentSong = {
    name: document.querySelector("#current-song-name"),
    artist: document.querySelector("#current-song-artist"),
    position: document.querySelector("#current-song-position"),
    slider: document.querySelector("#song-position-slider"),
    duration: document.querySelector("#current-song-duration"),
};

export const songControls = {
    buttons: {
        toggleShuffleButton: document.querySelector("#toggle-shuffle-button"),
        previousButton: document.querySelector("#previous-song-button"),
        togglePlayButton: document.querySelector("#toggle-play-button"),
        nextButton: document.querySelector("#next-song-button"),
        toggleLoopButton: document.querySelector("#toggle-loop-button"),
    },

    special: {
        pitchButton: document.querySelector("#pitch-button"),
        queueButton: document.querySelector("#queue-button"),
    },

    volume: {
        toggleButton: document.querySelector("#toggle-song-volume-button"),
        slider: document.querySelector("#volume-slider"),
    },
};
