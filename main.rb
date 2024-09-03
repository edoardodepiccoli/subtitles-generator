require "dotenv"
require "httparty"
require "json"
require_relative 'lib/transcriber'
require_relative 'lib/subtitles_writer'
Dotenv.load

api_key = ENV["API_KEY"] # this works yay
audio_file_path = 'medias/audio.mp3'

subtitles_output_path = 'output/subtitles.srt'

transcriber = Transcriber.new(api_key, audio_file_path)
words_list = transcriber.get_words_transcription # array of objects

subtitles_writer = SubtitlesWriter.new(subtitles_output_path)
subtitles_writer.convert_words_list_to_subtitles(words_list)







