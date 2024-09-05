require "dotenv"
require "httparty"
require "json"
require 'open3'
require 'colorize'
require_relative 'lib/app'

Dotenv.load
api_key = ENV["API_KEY"]

system("clear")
puts("copy and paste the video to subtitle path and then press enter")
puts("copia e incolla il percorso del video che vuoi sottotitolare e premi invio".colorize(:yellow))
video_path = gets.chomp
puts("do you want to subtitle by word or by sentence? (word/sentence)")
puts("vuoi sottotitolare parola per parola o frase per frase? (word/sentence)".colorize(:yellow))
granularity = gets.chomp

app = App.new(api_key, video_path, granularity)
app.generate_subtitles

puts("done")
puts("completato".colorize(:yellow))





