import { app, BrowserWindow } from "electron";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import * as fs from "fs";
import * as path from "path";

function onStdout(window: BrowserWindow, line: string, fileName: string): string {
    const waitingForSiteKey: string = "[download] Sleeping ";
    if (line.startsWith(waitingForSiteKey)) {
        const start: number = (waitingForSiteKey.indexOf(waitingForSiteKey) + waitingForSiteKey.length);
        const end: number = (start + line.substring(start).indexOf("."));
        const duration: number = Number(line.substring(start, end));

        window.webContents.send("youtube-onUpdate", `Waiting ${duration} seconds for the site...`);
        return fileName;
    }

    const startingDownloadKey: string = "[download] Destination: ";
    if (line.startsWith(startingDownloadKey)) {
        window.webContents.send("youtube-onUpdate", "Downloading...");
        return fileName;
    }

    const extractingAudioKey: string = "[ExtractAudio] Destination: ";
    if (line.startsWith(extractingAudioKey)) {
        window.webContents.send("youtube-onUpdate", "Extracting file...");
        return line.substring(line.indexOf(extractingAudioKey) + extractingAudioKey.length, line.indexOf(".mp3") + 4);
    }

    return fileName;
};

async function onClose(window: BrowserWindow, code: number | null, fileName: string): Promise<any> {
    if (code != null && code != 0) {
        return {
            success: false,
            error: String(code),
        };
    }

    const data: Buffer = await fs.promises.readFile(fileName);
    const uint8Data: Uint8Array = new Uint8Array(data);

    return {
        success: true,
        buffer: uint8Data,
    };
}

export async function downloadYoutubeSong(window: BrowserWindow, videoID: string): Promise<any> {
    const basePath: string = (app.isPackaged
        ? process.resourcesPath
        : app.getAppPath());

    const binPath: string = path.join(basePath, "bin");
    const ytDlpPath: string = path.join(binPath, "yt-dlp.exe");
    const ffmpegPath: string = path.join(binPath, "ffmpeg.exe");
    const outPath: string = path.join(binPath, "out", "temp.mp3");
    const videoUrl: string = `https://www.youtube.com/watch?v=${videoID}`;

    window.webContents.send("youtube-onUpdate", "Fetching data...");

    return await new Promise<any>((resolve) => {
        const args: string[] = [
            "-x",
            "--audio-format", "mp3",
            "--ffmpeg-location", ffmpegPath,
            "-o", outPath,
            "--force-overwrites", "--no-continue",
            videoUrl,
        ];

        const proc: ChildProcessWithoutNullStreams = spawn(ytDlpPath, args);

        let fileName: string = "";

        proc.stdout.on("data", (data: Buffer) => {
            fileName = onStdout(window, data.toString(), fileName);
        });

        proc.on("close", async (code: number | null) => resolve(await onClose(window, code, fileName)));
    });
}
