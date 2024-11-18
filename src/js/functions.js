function rand(min, max) { //v 1.0
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const minutesStr = String(minutes).padStart(1, "0");
    const secondsStr = String(remainingSeconds).padStart(2, "0");
    return `${minutesStr}:${secondsStr}`;
}

function isChildOf(element, child) {
    while (child) {
        if (element == child) {
            return true;
            break;
        }
        child = child.parentElement;
    }
    return false;
}

function getChildrenByName(playlists, name) {
    const parentID = Object.keys(playlists).find(id => playlists[id].name == name);
    if (!parentID) return [];

    function findChildren(parentID) {
        let children = [];
        for (const id in playlists) {
            if (playlists[id].parent == parseInt(parentID)) {
                children.push(playlists[id]);
                children = children.concat(findChildren(id));
            }
        }
        return children;
    }

    return findChildren(parentID);
}

function getPlaylistIdByName(playlists, name) {
    for (const id in playlists) if (playlists[id].name == name) return parseInt(id);
    return null;
}

function getSongIdByName(songs, name) {
    for (const id in songs) if (songs[id].name == name) return parseInt(id);
    return null;
}

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

function getPlaylistNameErrors(playlists, name) {
    const res = [];

    if (name == "") res.push("Playlist does not have a name");
    if (Object.values(playlists).map((p) => p.name).includes(name)) res.push(`A playlist named "${name}" already exist.`);
    const forbiddenCharacters = ['"', "/", "\\"];
    if (name.split("").map((c) => forbiddenCharacters.includes(c)).includes(true)) res.push(`Playlist name can't contain the characters [", /, \\].`);

    return res;
}

function getSongNameErrors(songs, name) {
    const res = [];

    if (name == "") res.push("Song does not have a name");
    if (Object.values(songs).map((s) => s.name).includes(name)) res.push(`A song named "${name}" already exist.`);
    const forbiddenCharacters = ['"', "/", "\\"];
    if (name.split("").map((c) => forbiddenCharacters.includes(c)).includes(true)) res.push(`Song name can't contain the characters [", /, \\].`);

    return res;
}
