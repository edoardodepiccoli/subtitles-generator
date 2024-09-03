class Converter

  def initialize(input_video_path, output_audio_path)
    @input_video_path = input_video_path
    @output_audio_path = output_audio_path
  end

  def convert_mp4_to_mp3
    move_old_audios # so user doesnt have to typy y to ffmpeg asking for overwrite
    system("ffmpeg -i medias/video.mp4 medias/audio.mp3")
  end

  private 

  def move_old_audios
    system("mv medias/audio.mp3 medias/old_audios/") if File.exist?("medias/audio.mp3")
  end

end