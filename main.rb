require 'httparty'
require 'json'

# Set your API key here
api_key = "YOUR_API_KEY"

# Set the path to your audio file here
audio_file_path = "path/to/your/audio/file.mp3"

# Make the request to the OpenAI API
response = HTTParty.post(
  "https://api.openai.com/v1/audio/transcriptions",
  headers: {
    "Authorization" => "Bearer #{api_key}"
  },
  body: {
    file: File.new(audio_file_path),
    model: "whisper-1"
  }
)

# Check for errors in the response
if response.code != 200
  puts "Error: #{response.body}"
  exit
end

# Parse the JSON response
json_response = JSON.parse(response.body)
segments = json_response["segments"]

# Function to format time for SRT (HH:MM:SS,ms)
def format_time(seconds)
  Time.at(seconds).utc.strftime("%H:%M:%S,%L")
end

# Generate the SRT file
File.open("subtitles.srt", "w") do |file|
  segments.each_with_index do |segment, index|
    start_time = format_time(segment["start"])
    end_time = format_time(segment["end"])
    text = segment["text"]

    file.puts "#{index + 1}"
    file.puts "#{start_time} --> #{end_time}"
    file.puts "#{text}\n\n"
  end
end

puts "Subtitles have been saved to subtitles.srt"
