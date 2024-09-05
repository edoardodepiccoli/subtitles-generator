class SubtitlesWriter

  def write_subtitles(response, subtitles_output_path, granularity)
    output_file = File.new(subtitles_output_path, "w")
    output_file.truncate(0)

    selector = granularity == "word" ? "words" : "segments"
    subselector = granularity == "word" ? "word" : "text"

    puts("working with #{response[selector]}")

    response[selector].each_with_index do |segment_details, index|
      start_time = format_time(segment_details["start"])
      end_time = format_time(segment_details["end"])
      item = segment_details[subselector]

      output_file.puts(index)
      output_file.puts("#{start_time} --> #{end_time}")
      output_file.puts(item)
      output_file.puts
    end
  end

  private

  def format_time(seconds)
    Time.at(seconds).utc.strftime("%H:%M:%S,%L")
  end

end