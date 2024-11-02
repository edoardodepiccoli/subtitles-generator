import json
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
API_KEY = os.getenv("API_KEY")
client = OpenAI(api_key=API_KEY)

def sanitize_path(path):
    return path.replace(" ", "\\ ")

def get_output_audio_path(source_video_path):
    source_video_name = os.path.basename(source_video_path)
    source_video_dir = os.path.dirname(source_video_path)

    output_audio_name = source_video_name.split(".")[0] + ".mp3"
    output_audio_path = os.path.join(source_video_dir, output_audio_name)

    return output_audio_path

def get_output_subtitles_path(source_video_path, granularity):
    source_video_name = os.path.basename(source_video_path)
    source_video_dir = os.path.dirname(source_video_path)

    output_subtitles_name = source_video_name.split(".")[0] + granularity + ".srt"
    output_subtitles_path = os.path.join(source_video_dir, output_subtitles_name)

    return output_subtitles_path

def convert_video(source_video_path):
    output_audio_path = get_output_audio_path(source_video_path)

    os.system(f'ffmpeg -iy {sanitize_path(source_video_path)} {sanitize_path(output_audio_path)}')

def print_success_message(message):
    print(f'{'\033[92m'}{message}{'\033[0m'}')


source_video_path = '/Users/edoardo/Downloads/cartella di prova/video di prova.mp4'
convert_video(source_video_path)

print_success_message("Video convertito con successo!")

print("Sto trascrivendo...")
source_audio_path = get_output_audio_path(source_video_path)

audio_file = open(source_audio_path, "rb")
transcript = client.audio.transcriptions.create(
    model="whisper-1",
    file=audio_file,
    response_format="verbose_json",
    timestamp_granularities=["word", "segment"]
)
transcript_json = json.dumps(transcript.to_dict())

print_success_message("Trascrizione ottenuta con successo!")
print("Scrivo i sottotitoli nel file")

words_subtitles_path = get_output_subtitles_path(source_video_path, "-words")
with open(words_subtitles_path, "w") as words_subtitles_file:
    words_subtitles_file.write(transcript_json)

print_success_message("Scritto i sottotitoli con successo!")
