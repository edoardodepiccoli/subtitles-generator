#!/usr/bin/env bun

import fs from "fs";
import path from "path";
import { Converter } from "./converter";
import { Logger } from "./logger";
import { Subtitler } from "./subtitler";
import { Utils } from "./utils";

function usage(): void {
  Logger.error("Usage: bun run index.ts /absolute/or/relative/path/to/media.(mp4|mp3|wav|...)");
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
    const repoRoot = import.meta.dir;
    const tempDir = path.join(repoRoot, "temp");

    if (!fs.existsSync(tempDir)) {
      await fs.promises.mkdir(tempDir, { recursive: true });
    }

    const baseName = path.basename(resolvedPath, path.extname(resolvedPath));
    const timestamp = Date.now();
    const tempFileName = `${baseName}-${timestamp}.mp3`;
    tempAudioPath = path.join(tempDir, tempFileName);

    try {
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

  const apiKey = Bun.env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  const subtitler = new Subtitler(apiKey);
  const transcription = await subtitler.getTranscription(audioPath);

  const baseName = path.basename(resolvedPath, path.extname(resolvedPath));
  const outputDir = path.dirname(resolvedPath);

  const words = Utils.collectWords(transcription);
  const wordsSrt = Utils.buildWordsSrt(words);
  const segmentsSrt = Utils.buildSegmentsSrt(transcription);

  const wordsSrtPath = path.join(outputDir, `${baseName}.words.srt`);
  const segmentsSrtPath = path.join(outputDir, `${baseName}.segments.srt`);

  await fs.promises.writeFile(wordsSrtPath, wordsSrt, "utf8");
  await fs.promises.writeFile(segmentsSrtPath, segmentsSrt, "utf8");

  Logger.success("Files written:");
  Logger.success(`  Words SRT:     ${wordsSrtPath}`);
  Logger.success(`  Segments SRT:  ${segmentsSrtPath}`);

  if (tempAudioPath && fs.existsSync(tempAudioPath)) {
    try {
      await fs.promises.unlink(tempAudioPath);
    } catch (err) {
      Logger.progress(`Warning: Could not delete temporary file: ${tempAudioPath}`);
    }
  }
}

main().catch((err) => {
  Logger.error(`Error: ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
});
