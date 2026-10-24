namespace Elements {
    function get<T extends Element>(query: string): T {
        const element: T | null = document.querySelector<T>(query);
        if (element === null) {
            throw new Error(`Could not get element: Element with query = "${query}" is null.`);
        }

        return element;
    }

    export const main: HTMLElement = (document.querySelector("main") as HTMLElement);

    export const aside = {
        playlists: {
            addButton: get<HTMLButtonElement>("#aside-container-playlists-manager-add-button"),
            container: get<HTMLUListElement>("#aside-container-playlists-container"),
        },

        songs: {
            settingsButton: get<HTMLButtonElement>("#aside-container-songs-manager-settings-button"),
        },

        artists: {
            settingsButton: get<HTMLButtonElement>("#aside-container-artists-manager-settings-button"),
        },
    };

    export const currentPlaylist = {
        container: get<HTMLElement>("#current-playlist-container"),

        details: {
            thumbnail: get<HTMLElement>("#current-playlist-thumbnail"),
            title: get<HTMLHeadingElement>("#current-playlist-title"),
            count: get<HTMLHeadingElement>("#current-playlist-count"),
            duration: get<HTMLHeadingElement>("#current-playlist-duration"),
            addButton: get<HTMLButtonElement>("#current-playlist-add-button"),
        },

        options: {
            playButton: get<HTMLButtonElement>("#current-playlist-play-button"),
            filterInput: get<HTMLInputElement>("#current-playlist-filter-input"),
        },

        table: {
            headerButtons: {
                id: get<HTMLButtonElement>("#current-playlist-header-id-button"),
                songTitle: get<HTMLButtonElement>("#current-playlist-header-title-button"),
                songArtist: get<HTMLButtonElement>("#current-playlist-header-artist-button"),
                playlistName: get<HTMLButtonElement>("#current-playlist-header-name-button"),
                playlistSongCount: get<HTMLButtonElement>("#current-playlist-header-songs-button"),
                duration: get<HTMLButtonElement>("#current-playlist-header-duration-button"),
            },

            rowsContainer: get<HTMLUListElement>("#current-playlist-song-table-rows-container"),
        },
    };

    export const parameters = {
        currentSongDetails: {
            title: get<HTMLHeadingElement>("#current-song-title"),
            artist: get<HTMLHeadingElement>("#current-song-artist"),
        },

        main: {
            buttons: {
                play: get<HTMLButtonElement>("#play-song-button"),
                shufflePlaylist: get<HTMLButtonElement>("#shuffle-playlist-button"),
                loopSong: get<HTMLButtonElement>("#loop-song-button"),
                previousSong: get<HTMLButtonElement>("#previous-song-button"),
                nextSong: get<HTMLButtonElement>("#next-song-button"),
            },

            currentSong: {
                currentTime: get<HTMLParagraphElement>("#current-song-current-time"),
                duration: get<HTMLParagraphElement>("#current-song-duration"),
                slider: get<HTMLInputElement>("#current-song-slider"),
            },
        },

        secondary: {
            queueButton: get<HTMLButtonElement>("#queue-button"),
            audioTransformButton: get<HTMLButtonElement>("#audio-transform-button"),

            volume: {
                muteButton: get<HTMLButtonElement>("#mute-button"),
                slider: get<HTMLInputElement>("#volume-slider"),
            },
        },
    };
};

export default Elements;
