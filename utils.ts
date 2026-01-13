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

export class Utils {
  static secondsToSrtTime(seconds: number): string {
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

  static sanitizeText(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }

  static buildWordLevelSrt(words: Word[]): string {
    const lines: string[] = [];

    words.forEach((w, idx) => {
      const start = this.secondsToSrtTime(w.start);
      const end = this.secondsToSrtTime(w.end);
      const text = this.sanitizeText(w.word);
      if (!text) return;

      lines.push(String(idx + 1));
      lines.push(`${start} --> ${end}`);
      lines.push(text);
      lines.push(""); // blank line between cues
    });

    return lines.join("\n");
  }

  static splitIntoSentenceSegments(words: Word[]): Segment[] {
    if (words.length === 0) return [];

    const segments: Segment[] = [];
    let currentWords: Word[] = [];

    const isSentenceEndPunctuation = (ch: string) => /[.!?]/.test(ch);

    for (const w of words) {
      currentWords.push(w);
      const lastChar = w.word.slice(-1);
      if (isSentenceEndPunctuation(lastChar)) {
        const text = this.sanitizeText(
          currentWords.map((cw) => cw.word).join(" ")
        );
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
      const text = this.sanitizeText(
        currentWords.map((cw) => cw.word).join(" ")
      );
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

  static buildSentenceLevelSrt(words: Word[]): string {
    const segments = this.splitIntoSentenceSegments(words);
    const lines: string[] = [];

    segments.forEach((seg, idx) => {
      const start = this.secondsToSrtTime(seg.start);
      const end = this.secondsToSrtTime(seg.end);
      const text = this.sanitizeText(seg.text);
      if (!text) return;

      lines.push(String(idx + 1));
      lines.push(`${start} --> ${end}`);
      lines.push(text);
      lines.push("");
    });

    return lines.join("\n");
  }

  static extractTranscriptText(transcription: {
    text?: string;
    segments?: Segment[];
  }): string {
    // With verbose_json format, the top-level 'text' field contains the properly
    // formatted transcript with capitalization and punctuation already applied
    if (transcription.text) {
      return transcription.text;
    }
    // Fallback: reconstruct from segments if text is not available
    if (transcription.segments && transcription.segments.length > 0) {
      return transcription.segments.map((seg) => seg.text).join(" ");
    }
    return "";
  }

  static collectWordsFromTranscription(transcription: {
    segments?: Segment[];
    text?: string;
  }): Word[] {
    const words: Word[] = [];

    if (transcription.segments && transcription.segments.length > 0) {
      for (const seg of transcription.segments) {
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
    } else if (transcription.text) {
      // Fallback: if no word-level timing, create a single segment (no useful word-level SRT)
      const text = this.sanitizeText(transcription.text);
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

  static buildLongFormSrtFromDiarized(
    diarizedTranscription: any
  ): string {
    // Handle diarized_json format - it has segments with speaker info
    if (!diarizedTranscription.segments) {
      return "";
    }

    const lines: string[] = [];
    diarizedTranscription.segments.forEach((seg: any, idx: number) => {
      const start = this.secondsToSrtTime(seg.start);
      const end = this.secondsToSrtTime(seg.end);
      const text = this.sanitizeText(seg.text || "");
      if (!text) return;

      lines.push(String(idx + 1));
      lines.push(`${start} --> ${end}`);
      lines.push(text);
      lines.push("");
    });

    return lines.join("\n");
  }
}
