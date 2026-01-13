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
    // Get repo root directory (where index.ts is located)
    const repoRoot = import.meta.dir;
    const tempDir = path.join(repoRoot, "temp");

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      await fs.promises.mkdir(tempDir, { recursive: true });
    }

    // Generate unique filename for temp MP3
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

  // Get JSON transcriptions
  const apiKey = Bun.env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  const subtitler = new Subtitler(apiKey);

  const longFormTranscription = await subtitler.getLongFormTranscription(audioPath);
  const wordLevelTranscription = await subtitler.getWordLevelTranscription(audioPath);

  // Process JSON into formats
  const baseName = path.basename(resolvedPath, path.extname(resolvedPath));
  const outputDir = path.dirname(resolvedPath);

  // Extract transcript text
  const transcriptText = Utils.extractTranscriptText(longFormTranscription);

  // Build SRT files
  const words = Utils.collectWordsFromTranscription(wordLevelTranscription);
  const wordLevelSrt = Utils.buildWordLevelSrt(words);
  const sentenceLevelSrt = Utils.buildSentenceLevelSrt(words);
  const longFormSrt = Utils.buildLongFormSrtFromDiarized(longFormTranscription);
  const multiSpeakerSrt = Utils.buildMultiSpeakerSrtFromDiarized(longFormTranscription);

  // Write files
  const txtFilePath = path.join(outputDir, `${baseName}.txt`);
  const longFormSrtPath = path.join(outputDir, `${baseName}.long-form.srt`);
  const shortFormSrtPath = path.join(outputDir, `${baseName}.short-form.srt`);
  const multiSpeakerSrtPath = path.join(outputDir, `${baseName}.multi-speaker.srt`);

  await fs.promises.writeFile(txtFilePath, transcriptText, "utf8");
  await fs.promises.writeFile(longFormSrtPath, longFormSrt, "utf8");
  await fs.promises.writeFile(shortFormSrtPath, wordLevelSrt, "utf8");
  await fs.promises.writeFile(multiSpeakerSrtPath, multiSpeakerSrt, "utf8");

  Logger.success("Files written:");
  Logger.success(`  Transcript TXT:        ${txtFilePath}`);
  Logger.success(`  Long-form SRT:         ${longFormSrtPath}`);
  Logger.success(`  Short-form SRT:        ${shortFormSrtPath}`);
  Logger.success(`  Multi-speaker SRT:     ${multiSpeakerSrtPath}`);

  // Clean up temporary audio file
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
