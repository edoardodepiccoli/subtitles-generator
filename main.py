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

def convert_video(source_video_path):
    output_audio_path = get_output_audio_path(source_video_path)

    os.system(f'ffmpeg -iy {sanitize_path(source_video_path)} {sanitize_path(output_audio_path)}')

def print_success_message(message):
    print(f'{'\033[92m'}{message}')


source_video_path = '/Users/edoardo/Downloads/cartella di prova/video di prova.mp4'
convert_video(source_video_path)

print_success_message("Video convertito con successo!")