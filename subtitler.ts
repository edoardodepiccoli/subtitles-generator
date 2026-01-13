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

  async getTranscription(filePath: string): Promise<any> {
    Logger.progress("Creating whisper-1 transcription...");
    
    const transcription = await this.openai.audio.transcriptions.create({
      file: Bun.file(filePath),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["word", "segment"],
    });

    Logger.progress("Transcription created");
    return transcription;
  }
}
