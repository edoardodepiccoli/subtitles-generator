class SubtitlesWriter

  def initialize(subtitles_output_path)
    @subtitles_output_path = subtitles_output_path
  end

  def convert_words_list_to_subtitles(words)
    output_file = File.new(@subtitles_output_path, "w")
    output_file.truncate(0)

    words.each_with_index do |word_details, index|
      start_time = format_time(word_details["start"])
      end_time = format_time(word_details["end"])
      word = word_details["word"]

      output_file.puts(index)
      output_file.puts("#{start_time} --> #{end_time}")
      output_file.puts(word)
      output_file.puts
    end
  end

  private

  def format_time(seconds)
    Time.at(seconds).utc.strftime("%H:%M:%S,%L")
  end

end