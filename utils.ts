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

  static buildWordsSrt(words: Word[]): string {
    const lines: string[] = [];

    words.forEach((w, idx) => {
      const start = this.secondsToSrtTime(w.start);
      const end = this.secondsToSrtTime(w.end);
      const text = this.sanitizeText(w.word);
      if (!text) return;

      lines.push(String(idx + 1));
      lines.push(`${start} --> ${end}`);
      lines.push(text);
      lines.push("");
    });

    return lines.join("\n");
  }

  static buildSegmentsSrt(transcription: { segments?: Segment[] }): string {
    if (!transcription.segments || transcription.segments.length === 0) {
      return "";
    }

    const lines: string[] = [];

    transcription.segments.forEach((seg, idx) => {
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

  static collectWords(transcription: { words?: Word[]; segments?: Segment[] }): Word[] {
    if (transcription.words && transcription.words.length > 0) {
      return transcription.words;
    }

    const words: Word[] = [];
    if (transcription.segments) {
      for (const seg of transcription.segments) {
        if (seg.words) {
          words.push(...seg.words);
        }
      }
    }
    return words;
  }
}
