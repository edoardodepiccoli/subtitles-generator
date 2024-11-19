import os
from datetime import timedelta
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
API_KEY = os.getenv("API_KEY")
client = OpenAI(api_key=API_KEY)

def create_unix_path(path):
    return path.replace(" ", "\\ ")

def change_path_extension(full_path, extension):
    video_dir = os.path.dirname(full_path)
    video_name = os.path.basename(full_path)
    return os.path.join(video_dir, f"{video_name.split(".")[0]}.{extension}")


def convert_video(full_path, extension):
    new_path = change_path_extension(full_path, extension)
    os.system(f"ffmpeg -i {create_unix_path(full_path)} -y {create_unix_path(new_path)}")
    return new_path

def get_transcription_object(audio_path):
    return client.audio.transcriptions.create(
        model="whisper-1",
        file=open(audio_path, "rb"),
        response_format="verbose_json",
        timestamp_granularities=["word", "segment"]
    )

def format_time(seconds):
    td = timedelta(seconds=seconds)
    hours, remainder = divmod(td.total_seconds(), 3600)
    minutes, seconds = divmod(remainder, 60)
    milliseconds = int((seconds % 1) * 1000)
    return f"{int(hours):02}:{int(minutes):02}:{int(seconds):02},{milliseconds:03}"

video_path = input("Inserisci il percorso del video e premi invio: ").replace("'", "")
audio_path = convert_video(video_path, "mp3")

os.system("clear")
print("Sto ottenendo la trascrizione...")

transcription_object = get_transcription_object(audio_path)
srt_file = open(change_path_extension(video_path, "srt"), "w")

print("Scrivo su file srt...")
i = 1
for word_object in transcription_object.words:
    srt_string = f"{i}\n{format_time(word_object.start)} --> {format_time(word_object.end)}\n{word_object.word}\n\n"
    srt_file.write(srt_string)
    i += 1

srt_file.close()
print("Completato!")
