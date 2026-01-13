#!/usr/bin/env bun

import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import OpenAI from "openai";

type Word = {
  word: string;
  start: number;
  end: number;
};

type DiarizedSegment = {
  type: string;
  id: string;
  start: number;
  end: number;
  text: string;
  speaker: string;
};

type DiarizedTranscription = {
  task: string;
  duration: number;
  text: string;
  segments: DiarizedSegment[];
  usage: {
    type: string;
    seconds: number;
  };
};

type WhisperWord = {
  word: string;
  start: number;
  end: number;
};

type WhisperTranscription = {
  task: string;
  language: string;
  duration: number;
  text: string;
  words: WhisperWord[];
  usage: {
    type: string;
    seconds: number;
  };
};

// ANSI color codes for clean CLI UX
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
};

function error(message: string): void {
  console.error(`${colors.red}${message}${colors.reset}`);
}

function progress(message: string): void {
  console.log(`${colors.yellow}${message}${colors.reset}`);
}

function success(message: string): void {
  console.log(`${colors.green}${message}${colors.reset}`);
}

function usage(): void {
  error("Usage: bun run index.ts /absolute/or/relative/path/to/media.(mp4|mp3|wav|...)");
}

// Video file extensions that need conversion
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

function isVideoFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return VIDEO_EXTENSIONS.has(ext);
}

async function convertVideoToAudio(
  videoPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    progress(`Converting video to audio: ${path.basename(videoPath)}`);

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

function sanitizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function buildWordLevelSrt(words: WhisperWord[]): string {
  const lines: string[] = [];

  words.forEach((w, idx) => {
    const start = secondsToSrtTime(w.start);
    const end = secondsToSrtTime(w.end);
    const text = sanitizeText(w.word);
    if (!text) return;

    lines.push(String(idx + 1));
    lines.push(`${start} --> ${end}`);
    lines.push(text);
    lines.push(""); // blank line between cues
  });

  return lines.join("\n");
}

function buildSegmentLevelSrt(segments: DiarizedSegment[]): string {
  const lines: string[] = [];

  segments.forEach((seg, idx) => {
    const start = secondsToSrtTime(seg.start);
    const end = secondsToSrtTime(seg.end);
    const text = sanitizeText(seg.text);
    if (!text) return;

    lines.push(String(idx + 1));
    lines.push(`${start} --> ${end}`);
    lines.push(text);
    lines.push(""); // blank line between cues
  });

  return lines.join("\n");
}

async function transcribeWithDiarization(filePath: string): Promise<DiarizedTranscription> {
  const apiKey = Bun.env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }

  const openai = new OpenAI({ apiKey });

  const file = fs.createReadStream(filePath);

  progress("Getting transcription with speaker diarization...");

  const transcript = await openai.audio.transcriptions.create({
    file,
    model: "gpt-4o-transcribe-diarize",
    response_format: "json",
    chunking_strategy: "auto",
  } as any);

  // Pretty log the raw JSON response
  console.log("\n" + colors.yellow + "Raw OpenAI Response (Diarization):" + colors.reset);
  console.log(JSON.stringify(transcript, null, 2));

  return transcript as unknown as DiarizedTranscription;
}

async function transcribeWithWhisperWordLevel(filePath: string): Promise<WhisperTranscription> {
  const apiKey = Bun.env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }

  const openai = new OpenAI({ apiKey });

  const file = fs.createReadStream(filePath);

  progress("Getting word-level timestamps with Whisper...");

  const transcript = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["word"],
  } as any);

  // Pretty log the raw JSON response
  console.log("\n" + colors.yellow + "Raw OpenAI Response (Whisper Word-Level):" + colors.reset);
  console.log(JSON.stringify(transcript, null, 2));

  return transcript as unknown as WhisperTranscription;
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
    error(`File not found: ${resolvedPath}`);
    process.exitCode = 1;
    return;
  }

  const stat = fs.statSync(resolvedPath);
  if (!stat.isFile()) {
    error(`Not a file: ${resolvedPath}`);
    process.exitCode = 1;
    return;
  }

  // Convert video to audio if needed
  let audioPath = resolvedPath;
  let tempAudioPath: string | null = null;

  if (isVideoFile(resolvedPath)) {
    const dir = path.dirname(resolvedPath);
    const baseName = path.basename(resolvedPath, path.extname(resolvedPath));
    tempAudioPath = path.join(dir, `${baseName}.temp.mp3`);

    try {
      await convertVideoToAudio(resolvedPath, tempAudioPath);
      audioPath = tempAudioPath;
    } catch (err) {
      error(
        err instanceof Error
          ? err.message
          : "Failed to convert video to audio"
      );
      process.exitCode = 1;
      return;
    }
  }

  progress(`Transcribing: ${path.basename(resolvedPath)}`);

  let diarizedTranscription: DiarizedTranscription;
  let whisperTranscription: WhisperTranscription;

  try {
    // First, get diarized transcription for segment-level SRT and TXT
    diarizedTranscription = await transcribeWithDiarization(audioPath);

    // Then, get word-level timestamps from Whisper for word-level SRT
    whisperTranscription = await transcribeWithWhisperWordLevel(audioPath);
  } finally {
    // Clean up temporary audio file
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      try {
        await fs.promises.unlink(tempAudioPath);
      } catch (err) {
        // Non-fatal: just warn if cleanup fails
        progress(`Warning: Could not delete temporary file: ${tempAudioPath}`);
      }
    }
  }

  // Validate responses
  const hasSegments = diarizedTranscription.segments && diarizedTranscription.segments.length > 0;
  const hasWords = whisperTranscription.words && whisperTranscription.words.length > 0;

  if (!diarizedTranscription.text) {
    error("No text found in diarized transcription.");
    error("Response structure:");
    console.error(JSON.stringify(diarizedTranscription, null, 2));
    process.exitCode = 1;
    return;
  }

  if (!hasSegments) {
    progress("Warning: No segments found in diarized transcription. Segment-level SRT will be skipped.");
  }

  if (!hasWords) {
    progress("Warning: No word-level timing available. Word-level SRT will be empty.");
  }

  const dir = path.dirname(resolvedPath);
  const ext = path.extname(resolvedPath);
  const baseName = path.basename(resolvedPath, ext);

  const segmentSrtPath = path.join(dir, `${baseName}.segments.srt`);
  const wordSrtPath = path.join(dir, `${baseName}.words.srt`);
  const transcriptPath = path.join(dir, `${baseName}.txt`);

  // Build SRT files and TXT transcription
  const segmentSrt = hasSegments ? buildSegmentLevelSrt(diarizedTranscription.segments!) : "";
  const wordSrt = hasWords ? buildWordLevelSrt(whisperTranscription.words!) : "";
  const transcriptText = diarizedTranscription.text.trim();

  if (hasSegments) {
    await fs.promises.writeFile(segmentSrtPath, segmentSrt, "utf8");
  }
  if (hasWords) {
    await fs.promises.writeFile(wordSrtPath, wordSrt, "utf8");
  }
  await fs.promises.writeFile(transcriptPath, transcriptText, "utf8");

  success("Files written:");
  if (hasSegments) {
    success(`  Segment-level SRT: ${segmentSrtPath}`);
  } else {
    progress(`  Segment-level SRT: (skipped - no segments available)`);
  }
  if (hasWords) {
    success(`  Word-level SRT:     ${wordSrtPath}`);
  } else {
    progress(`  Word-level SRT:     (skipped - no word-level timing available)`);
  }
  success(`  Transcript TXT:     ${transcriptPath}`);
}

main().catch((err) => {
  error(`Error: ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
});
