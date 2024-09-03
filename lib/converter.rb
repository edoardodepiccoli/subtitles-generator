class Converter

  def initialize(input_video_path, output_audio_path)
    @input_video_path = input_video_path
    @output_audio_path = output_audio_path
  end

  def convert_mp4_to_mp3
    system("ffmpeg -i medias/video.mp4 medias/audio.mp3")
  end

end