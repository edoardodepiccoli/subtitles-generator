require "openai"

class Transcriber

  def initialize(api_key, audio_file_path)
    @api_key = api_key
    @audio_file_path = audio_file_path
  end

  def get_transcription(granularity)
    client = OpenAI::Client.new( access_token: @api_key, log_errors: true)
    response = client.audio.transcribe(
      parameters: {
          model: "whisper-1",
          file: File.open(@audio_file_path, "rb"),
          response_format: "verbose_json",
          timestamp_granularities: ["word", "segment"]
      })

    cache = File.new('cache.json', 'w')
    cache.truncate(0)
    cache.puts(JSON.dump(response))

    response
  end

end