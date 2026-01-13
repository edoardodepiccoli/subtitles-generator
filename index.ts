#!/usr/bin/env bun

import fs from "fs";
import path from "path";

import { Converter } from "./converter";
import { Logger } from "./logger";

function usage(): void {
  Logger.error("Usage: bun run index.ts /absolute/or/relative/path/to/media.(mp4|mp3|wav|...)");
}

function secondsToSrtTime(seconds: number): string {
  const msTotal = Math.max(0, Math.round(seconds * 1000));
  const ms = msTotal % 1000;
  const totalSeconds = Math.floor(msTotal / 1000);
  const s = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  const h = Math.floor(totalMinutes / 60);

  const pad = (n: number, width = 2) => n.toString().padStart(width, "0");

  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

async function main() {
  const argPath = Bun.argv[2];

  if (!argPath) {
    usage();
    process.exitCode = 1;
    return;
  }

  const resolvedPath = path.resolve(argPath);

  if (!fs.existsSync(resolvedPath)) {
    Logger.error(`File not found: ${resolvedPath}`);
    process.exitCode = 1;
    return;
  }

  const stat = fs.statSync(resolvedPath);
  if (!stat.isFile()) {
    Logger.error(`Not a file: ${resolvedPath}`);
    process.exitCode = 1;
    return;
  }

  let audioPath = resolvedPath;
  let tempAudioPath: string | null = null;

  if (Converter.isVideoFile(resolvedPath)) {
    const dir = path.dirname(resolvedPath);
    const baseName = path.basename(resolvedPath, path.extname(resolvedPath));
    tempAudioPath = path.join(dir, `${baseName}.temp.mp3`);

    try {
      Logger.progress(`Converting video to audio: ${path.basename(resolvedPath)}`);
      await Converter.convertVideoToAudio(resolvedPath, tempAudioPath);
      audioPath = tempAudioPath;
    } catch (err) {
      Logger.error(
        err instanceof Error
          ? err.message
          : "Failed to convert video to audio"
      );
      process.exitCode = 1;
      return;
    }
  }

  Logger.progress(`Processing file: ${audioPath}`);
}

main().catch((err) => {
  Logger.error(`Error: ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
});
