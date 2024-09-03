require_relative 'transcriber'
require_relative 'subtitles_writer'

class App

  def initialize(api_key, operational_directory)
    @transcription_granularity = "sentence"
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

    if @transcription_granularity == "word"
      words_list = @transcriber.get_words_transcription
      @subtitles_writer.convert_words_list_to_subtitles(words_list, @subtitles_output_path)
    elsif @transcription_granularity == "sentence"
      sentences_list = @transcriber.get_sentences_transcription
      @subtitles_writer.convert_sentences_list_to_subtitles(sentences_list, @subtitles_output_path)
    end    
  end

  private

  def get_video_extension
    video_file_extension = File.extname(@video_file_path)
  end

  def convert_video_to_mp3(video_file_path, audio_file_path)
    system("ffmpeg -i #{video_file_path} #{audio_file_path}")
  end
end