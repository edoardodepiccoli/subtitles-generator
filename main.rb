require "dotenv"
require "httparty"
require "json"
require_relative 'lib/transcriber'
require_relative 'lib/subtitles_writer'
require_relative 'lib/converter'
Dotenv.load

api_key = ENV["API_KEY"] # this works yay
video_file_path = 'medias/video.mp4'
audio_file_path = 'medias/audio.mp3'
subtitles_output_path = 'output/subtitles.srt'

converter = Converter.new(video_file_path, audio_file_path)
converter.convert_mp4_to_mp3

transcriber = Transcriber.new(api_key, audio_file_path)
words_list = transcriber.get_words_transcription # array of objects

subtitles_writer = SubtitlesWriter.new(subtitles_output_path)
subtitles_writer.convert_words_list_to_subtitles(words_list)




