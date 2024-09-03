# subtitles-generator
this is a super basic script that generates subtitles for an mp4 video


## why this script
my dad is a youtuber and always used capcut to generate subtitles for his videos after editing them in davinci resolve. capcut recently made this a pro membership option, so no good :(

I figured out that, since my dad is already using davinci resolve to make videos, I could create a simple script to help him solve this problem. i love solving problems with coding, very useful skill

## how it works
the program is meant to be self contained, the user should know how to install and use ruby, install dependencies, install and use ffmpeg, know where to place the video to subtitle, how to name it and where to find the output track... so it is NOT user friendly at all!

doesnt matter because it is just a simple script i will be using myself and nobody else. of course i plan to add more features tho:

## features to add
- first of all, implement some sort of error handling
- let user choose source video and subtitles track destination with a gui
- make the subtitle writer write subtitles in two different formats: words and sentences (implement another function or some form of block control in the ruby method idk rn)
- make the program a simple executable that doesnt make the user go crazy


after doing all of this

- let the user input his openai api key and save it to a config file
- maybe add a gui so it would me more marketable

and even after this

- make it into a no bs, cheap, non profit Saas that people can use to happily add subtitles to their videos, paying just the right amount (server operational cost)

these are just some random ideas btw, nothing serious yet