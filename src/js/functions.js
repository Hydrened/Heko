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
async function readJSONFile(filePath) { // v1.0
    try {
        const data = await fs.readFile(filePath, "utf8");
        return JSON.parse(data);
    } catch (err) {
        alert(`Error reading or parsing the file ${filePath}:`, err);
        throw err;
    }
}
async function writeJSONFile(filePath, data) { // v1.0
    try {
        const jsonData = JSON.stringify(data, null, 2);
        await fs.writeFile(filePath, jsonData, "utf8");
    } catch (err) {
        alert(`Error writing the file ${filePath}:`, err);
        throw err;
    }
}