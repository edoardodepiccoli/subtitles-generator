require "dotenv"
require "httparty"
require "json"
Dotenv.load

# api_key = ENV["API_KEY"] # this works yay
# audio_file_path = 'medias/audio.mp3'

# response = HTTParty.post(
#   "https://api.openai.com/v1/audio/transcriptions",
#   headers: {
#     "Authorization" => "Bearer #{api_key}"
#   },
#   body: {
#     file: File.new(audio_file_path),
#     model: "whisper-1",
#     response_format: "verbose_json",
#     "timestamp_granularities[]": "word"
#   }
# )

# if response.code != 200
#   puts "Error: #{response.body}"
#   exit
# end

# json_response = JSON.parse(response.body)
# segments = json_response["segments"]