class Transcriber

  def initialize(api_key, audio_file_path)
    @api_key = api_key
    @audio_file_path = audio_file_path
  end

  def get_words_transcription
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

    if response.code != 200
      puts "Error: #{response.body}"
      exit
    end

    json_response = JSON.parse(response.body)
    words = json_response["words"]

    words
  end

end