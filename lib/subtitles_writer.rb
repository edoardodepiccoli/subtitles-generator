class SubtitlesWriter

  def write_subtitles(segments_list, subtitles_output_path, granularity)
    output_file = File.new(subtitles_output_path, "w")
    output_file.truncate(0)

    text_body_selector = granularity == "word" ? "word" : "text"

    segments_list.each_with_index do |segment_details, index|
      start_time = format_time(segment_details["start"])
      end_time = format_time(segment_details["end"])
      segment = segment_details[text_body_selector]

      output_file.puts(index)
      output_file.puts("#{start_time} --> #{end_time}")
      output_file.puts(segment)
      output_file.puts
    end
  end

  private

  def format_time(seconds)
    Time.at(seconds).utc.strftime("%H:%M:%S,%L")
  end

end