## subtitles-generator

Simple TypeScript CLI that turns a video or audio file into two SRT subtitle files using OpenAI Whisper.

### Setup

- **Install dependencies**:

```bash
bun install
```

- **Set your OpenAI API key**:

```bash
export OPENAI_API_KEY=sk-...
```

### Usage

Run the CLI with Bun, passing a path to a media file (audio or video):

```bash
bun run index.ts /path/to/media/file.mp4
```

The tool will call OpenAI Whisper (`whisper-1`) to transcribe the file and will write two SRT files next to the original:

- `file.sentences.srt` – long-form, horizontal content (whole sentences per cue)
- `file.words.srt` – short-form, vertical content (single words per cue)

Both outputs are standard `.srt` files that should work in most players and editing tools.
