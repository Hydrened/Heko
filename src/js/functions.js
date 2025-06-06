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

function parseTime(timeStr) {
    const parts = timeStr.split(":").map(Number);
    if (parts.length == 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length == 2) return parts[0] * 60 + parts[1];
    else return 0;
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

function randomInRange(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
    return Math.max(Math.min(value, max), min);
}

function isDigit(char) {
    return /^[0-9]$/.test(char);
}

function getFormattedDate() {
    const now = new Date();
    const year = String(now.getFullYear()).slice(2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}
