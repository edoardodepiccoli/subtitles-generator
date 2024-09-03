require_relative 'transcriber'
require_relative 'subtitles_writer'

class App

  def initialize(api_key, operational_directory)
    @api_key = api_key

    @video_file_path = File.join(operational_directory, 'video_to_subtitle.mp4')
    @audio_file_path = File.join(operational_directory, 'audio_to_subtitle.mp3')
    @subtitles_output_path = File.join(operational_directory, 'subtitles.srt')

    subtitles_type = "word"
    @transcriber = Transcriber.new(@api_key, @audio_file_path)
    @subtitles_writer = SubtitlesWriter.new(subtitles_type)
  end

  def generate_subtitles
    #convert video to audio
    convert_video_to_mp3(@video_file_path, @audio_file_path)

    # get subtitles from openai
    words_list = @transcriber.get_words_transcription

    # write subtitles.srt file
    @subtitles_writer.convert_words_list_to_subtitles(words_list, @subtitles_output_path)
  end

  private

  def get_video_extension
    video_file_extension = File.extname(@video_file_path)
  end

  def convert_video_to_mp3(video_file_path, audio_file_path)
    system("ffmpeg -i #{video_file_path} #{audio_file_path}")
  end
end