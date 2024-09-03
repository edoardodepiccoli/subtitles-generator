class SubtitlesWriter

  def initialize(subtitles_type)
    @subtitles_type = subtitles_type
  end

  def convert_words_list_to_subtitles(words_list, subtitles_output_path)
    output_file = File.new(subtitles_output_path, "w")
    output_file.truncate(0)

    words_list.each_with_index do |word_details, index|
      start_time = format_time(word_details["start"])
      end_time = format_time(word_details["end"])
      word = word_details["word"]

      output_file.puts(index)
      output_file.puts("#{start_time} --> #{end_time}")
      output_file.puts(word)
      output_file.puts
    end
  end

  def convert_sentences_list_to_subtitles(sentences_list, subtitles_output_path)
    output_file = File.new(subtitles_output_path, "w")
    output_file.truncate(0)

    sentences_list.each_with_index do |sentence_details, index|
      start_time = format_time(sentence_details["start"])
      end_time = format_time(sentence_details["end"])
      text = sentence_details["text"]

      output_file.puts(index)
      output_file.puts("#{start_time} --> #{end_time}")
      output_file.puts(text)
      output_file.puts
    end
  end

  private

  def format_time(seconds)
    Time.at(seconds).utc.strftime("%H:%M:%S,%L")
  end

end