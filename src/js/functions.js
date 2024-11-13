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