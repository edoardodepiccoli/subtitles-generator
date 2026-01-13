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

type Segment = {
  start: number;
  end: number;
  text: string;
  words?: Word[];
};

type VerboseTranscription = {
  text: string;
  language: string;
  segments?: Segment[];
};

const MODEL_NAME = "whisper-1";

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

function buildWordLevelSrt(words: Word[]): string {
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

function splitIntoSentenceSegments(words: Word[]): Segment[] {
  if (words.length === 0) return [];

  const segments: Segment[] = [];
  let currentWords: Word[] = [];

  const isSentenceEndPunctuation = (ch: string) => /[.!?]/.test(ch);

  for (const w of words) {
    currentWords.push(w);
    const lastChar = w.word.slice(-1);
    if (isSentenceEndPunctuation(lastChar)) {
      const text = sanitizeText(currentWords.map((cw) => cw.word).join(" "));
      if (text) {
        const first = currentWords[0]!;
        const last = currentWords[currentWords.length - 1]!;
        segments.push({
          start: first.start,
          end: last.end,
          text,
        });
      }
      currentWords = [];
    }
  }

  // Flush remaining words as last segment
  if (currentWords.length > 0) {
    const text = sanitizeText(currentWords.map((cw) => cw.word).join(" "));
    if (text) {
      const first = currentWords[0]!;
      const last = currentWords[currentWords.length - 1]!;
      segments.push({
        start: first.start,
        end: last.end,
        text,
      });
    }
  }

  return segments;
}

function buildSentenceLevelSrt(words: Word[]): string {
  const segments = splitIntoSentenceSegments(words);
  const lines: string[] = [];

  segments.forEach((seg, idx) => {
    const start = secondsToSrtTime(seg.start);
    const end = secondsToSrtTime(seg.end);
    const text = sanitizeText(seg.text);
    if (!text) return;

    lines.push(String(idx + 1));
    lines.push(`${start} --> ${end}`);
    lines.push(text);
    lines.push("");
  });

  return lines.join("\n");
}

async function transcribeFile(filePath: string): Promise<VerboseTranscription> {
  const apiKey = Bun.env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }

  const openai = new OpenAI({ apiKey });

  const file = fs.createReadStream(filePath);

  const transcript = await openai.audio.transcriptions.create({
    file,
    model: MODEL_NAME,
    response_format: "verbose_json",
    timestamp_granularities: ["word"],
  } as any);

  // The SDK types may not yet fully reflect verbose_json; coerce to our type
  return transcript as unknown as VerboseTranscription;
}

function collectWordsFromTranscription(t: VerboseTranscription): Word[] {
  const words: Word[] = [];

  if (t.segments && t.segments.length > 0) {
    for (const seg of t.segments) {
      if (seg.words && seg.words.length > 0) {
        for (const w of seg.words) {
          if (typeof w.start === "number" && typeof w.end === "number") {
            words.push({
              word: w.word,
              start: w.start,
              end: w.end,
            });
          }
        }
      }
    }
  } else if (t.text) {
    // Fallback: if no word-level timing, create a single segment (no useful word-level SRT)
    const text = sanitizeText(t.text);
    if (text) {
      const avgWordDuration = 0.5; // rough guess, used only if absolutely needed
      const splitWords = text.split(/\s+/);
      let cursor = 0;
      for (const w of splitWords) {
        const start = cursor;
        const end = cursor + avgWordDuration;
        cursor = end;
        words.push({ word: w, start, end });
      }
    }
  }

  return words;
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

  let transcription: VerboseTranscription;
  let words: Word[];

  try {
    transcription = await transcribeFile(audioPath);
    words = collectWordsFromTranscription(transcription);
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

  if (words.length === 0) {
    error("No word-level timing information available in transcription.");
    process.exitCode = 1;
    return;
  }

  const dir = path.dirname(resolvedPath);
  const ext = path.extname(resolvedPath);
  const baseName = path.basename(resolvedPath, ext);

  const sentenceSrtPath = path.join(dir, `${baseName}.sentences.srt`);
  const wordSrtPath = path.join(dir, `${baseName}.words.srt`);

  const sentenceSrt = buildSentenceLevelSrt(words);
  const wordSrt = buildWordLevelSrt(words);

  await fs.promises.writeFile(sentenceSrtPath, sentenceSrt, "utf8");
  await fs.promises.writeFile(wordSrtPath, wordSrt, "utf8");

  success("SRT files written:");
  success(`  Sentence-level: ${sentenceSrtPath}`);
  success(`  Word-level:     ${wordSrtPath}`);
}

main().catch((err) => {
  error(`Error: ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
});