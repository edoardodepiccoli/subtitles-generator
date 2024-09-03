require_relative 'transcriber'
require_relative 'subtitles_writer'
require "shellwords"

class App

  def initialize(api_key, video_path, granularity)
    @api_key = api_key
    @video_path = video_path
    @granularity = granularity

    @output_audio_path = File.join(File.dirname(@video_path), File.basename(video_path).split(".")[0]) + ".mp3"
    @output_subtitles_path = File.join(File.dirname(@video_path), File.basename(video_path).split(".")[0]) + ".srt"

    @transcriber = Transcriber.new(@api_key, @output_audio_path)
    @subtitles_writer = SubtitlesWriter.new
  end

  def generate_subtitles
    convert_video_to_mp3
    segments_list = @transcriber.get_transcription(@granularity)
    @subtitles_writer.write_subtitles(segments_list, @output_subtitles_path, @granularity)
  end

  private

  def convert_video_to_mp3
    system("ffmpeg -i #{Shellwords.escape(@video_path)} #{Shellwords.escape(@output_audio_path)}")
  end
end