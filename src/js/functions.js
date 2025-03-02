function sortPlaylistsByDependencies(playlists) {
    const sorted = [];
    const visited = {};

    function visit(id) {
        if (visited[id]) return;
        visited[id] = true;
        
        const playlist = playlists[id];
        if (playlist.parent != null && playlists[playlist.parent]) visit(playlist.parent);
        
        sorted.push({ id: parseInt(id), ...playlist });
    }
    Object.keys(playlists).forEach(id => visit(id));
    return sorted;
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const minutesStr = hours > 0 
        ? String(minutes).padStart(2, "0")
        : String(minutes);

    const secondsStr = String(remainingSeconds).padStart(2, "0");
    return hours > 0 
        ? `${hours}:${minutesStr}:${secondsStr}`
        : `${minutes}:${secondsStr}`;
}

function parseDuration(duration) {
    if (duration === "-:--") return 0;
    const parts = duration.split(":").map(Number);
    if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        return hours * 3600 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
        const [minutes, seconds] = parts;
        return minutes * 60 + seconds;
    }
    return 0;
}
