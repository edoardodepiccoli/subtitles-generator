class Transcriber

  def initialize(api_key, audio_file_path)
    @api_key = api_key
    @audio_file_path = audio_file_path
  end

  def get_transcription(granularity)
    cache = File.new('cache.json', 'w')
    cache.truncate(0)

    if granularity == "sentence"
      response = HTTParty.post(
        "https://api.openai.com/v1/audio/transcriptions",
        headers: {
          "Authorization" => "Bearer #{@api_key}"
        },
        body: {
          file: File.new(@audio_file_path),
          model: "whisper-1",
          response_format: "verbose_json"
        }
      )    
    elsif granularity == "word"
      response = HTTParty.post(
        "https://api.openai.com/v1/audio/transcriptions",
        headers: {
          "Authorization" => "Bearer #{@api_key}"
        },
        body: {
          file: File.new(@audio_file_path),
          model: "whisper-1",
          response_format: "verbose_json",
          "timestamp_granularities[]": "word"
        }
      )
    end

    if response.code != 200
      puts "Error: #{response.body}"
      exit
    end

    cache.puts(response)

    json_response = JSON.parse(response.body)
    segments = json_response["segments"]

    segments
  end

end