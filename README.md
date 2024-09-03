# Subtitles Generator

A simple yet powerful script to generate subtitles for MP4 videos.

## Table of Contents
- [Introduction](#introduction)
- [Motivation](#motivation)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [Usage](#usage)
- [Planned Features](#planned-features)
- [Contributing](#contributing)
- [License](#license)

## Introduction
`subtitles-generator` is a basic Ruby script designed to generate subtitles for MP4 videos. While the script is currently rudimentary and not user-friendly, it serves as a starting point for more advanced features in the future.

## Motivation
The inspiration for this script comes from a real-world problem. My father, a YouTuber, used CapCut to generate subtitles after editing his videos in DaVinci Resolve. However, CapCut recently moved this feature behind a pro membership, which prompted the need for an alternative solution. Given that he already uses DaVinci Resolve, I decided to create a simple script to address this issue. Solving problems through code is something I enjoy, and this script is the result of that passion.

## How It Works
This script is designed to be self-contained but requires some technical knowledge to use effectively:
- Basic understanding of Ruby, including how to install and run scripts.
- Familiarity with installing dependencies and using `ffmpeg`.
- Knowledge of where to place the video file for subtitle generation and where to find the output.

**Note:** This script is not designed to be user-friendly in its current state, as it was initially created for personal use. However, there are plans to enhance its usability in the future.

## Installation
To get started with `subtitles-generator`, follow these steps:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/edoardodepiccoli/subtitles-generator.git
   cd subtitles-generator
   ```

2. **Install Dependencies:**
   Ensure that Ruby is installed on your system. You can install the required gems by running:
   ```bash
   bundle install
   ```

3. **Install ffmpeg:**
   `ffmpeg` is required for processing video files. Install it using your package manager. For example:
   ```bash
   # On macOS
   brew install ffmpeg

   # On Ubuntu
   sudo apt-get install ffmpeg
   ```

## Usage
1. **Prepare Your Video:**
   - Place the MP4 video file in the designated folder.
   - Ensure the file is named correctly as per the script’s requirements.

2. **Run the Script:**
   ```bash
   ruby main.rb
   ```

3. **Find Your Subtitles:**
   - The generated subtitles track will be saved in the specified output directory.

## Planned Features
While the script is functional, I have several enhancements in mind to improve its usability and functionality:

- **Error Handling:** Implement robust error handling to manage unexpected issues.
- **User Interface:** Create a GUI to allow users to select the source video and subtitle destination easily.
- **Subtitle Formats:** Enable the script to generate subtitles in both word-by-word and sentence-by-sentence formats.
- **Executable Version:** Package the script as a standalone executable to simplify the user experience.
- **OpenAI Integration:** Allow users to input their OpenAI API key and save it to a configuration file.
- **Commercialization:** Potentially evolve the script into a no-frills, affordable, non-profit SaaS for generating subtitles.

## Contributing
Contributions are welcome! If you have suggestions for improvements or new features, feel free to fork the repository and submit a pull request. Please ensure that your changes are well-documented and tested.
