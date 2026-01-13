# 1. Load environment and paths
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
export OPENAI_API_KEY="sk-..."

BUN_BIN="/Users/edoardo/.bun/bin/bun"
SCRIPT_PATH="/Users/edoardo/repos/subtitles-generator/index.ts"

# 2. Iterate through the dropped files
for f in "$@"
do
    filename=$(basename "$f")
    
    # Notify user that processing has started
    osascript -e "display notification \"Generating subtitles for $filename...\" with title \"Whisper Transcriber\""

    # Run the Bun script
    $BUN_BIN run "$SCRIPT_PATH" "$f"

    # Check exit code to send success/fail notification
    if [ $? -eq 0 ]; then
        osascript -e "display notification \"Finished: $filename\" with title \"Whisper Transcriber\" subtitle \"SRT files created successfully\" sound name \"Glass\""
    else
        osascript -e "display notification \"Failed to process $filename\" with title \"Whisper Transcriber\" subtitle \"Check script logs for details\" sound name \"Basso\""
    fi
done