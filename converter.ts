import path from "path";
import { spawn } from "child_process";
import { Logger } from "./logger";

const VIDEO_EXTENSIONS = new Set([
  ".mov",
  ".mp4",
  ".avi",
  ".mkv",
  ".webm",
  ".flv",
  ".wmv",
  ".m4v",
  ".3gp",
]);

export class Converter {
  static isVideoFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return VIDEO_EXTENSIONS.has(ext);
  }

  static async convertVideoToAudio(
    videoPath: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      Logger.progress(`Converting video to audio: ${path.basename(videoPath)}`);

      const ffmpeg = spawn("ffmpeg", [
        "-i",
        videoPath,
        "-vn", // no video
        "-acodec",
        "libmp3lame", // MP3 codec
        "-ar",
        "16000", // sample rate (good for speech)
        "-ac",
        "1", // mono
        "-y", // overwrite output file
        outputPath,
      ]);

      let stderr = "";

      ffmpeg.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      ffmpeg.on("close", (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `ffmpeg failed with code ${code}. Make sure ffmpeg is installed. Error: ${stderr.slice(-500)}`
            )
          );
        } else {
          resolve();
        }
      });

      ffmpeg.on("error", (err) => {
        reject(
          new Error(
            `Failed to run ffmpeg. Is it installed? ${err.message}`
          )
        );
      });
    });
  }
}
