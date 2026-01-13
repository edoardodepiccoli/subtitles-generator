import OpenAI from "openai";
import { Logger } from "./logger";

export class Subtitler {
  private openai: OpenAI;

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set.");
    }
    this.openai = new OpenAI({ apiKey });
  }

  async getLongFormTranscription(
    filePath: string
  ): Promise<any> {
    Logger.progress("Creating transcription for txt transcript and long-form srt...");
    
    const transcription = await this.openai.audio.transcriptions.create({
      file: Bun.file(filePath),
      model: "gpt-4o-transcribe-diarize",
      response_format: "diarized_json",
      chunking_strategy: "auto"
    });

    Logger.progress("Long-form transcription created");
    return transcription;
  }

  async getWordLevelTranscription(
    filePath: string
  ): Promise<any> {
    Logger.progress("Creating transcription for word-level srt...");
    
    const transcription = await this.openai.audio.transcriptions.create({
      file: Bun.file(filePath),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
    });

    Logger.progress("Word-level transcription created");
    return transcription;
  }
}
