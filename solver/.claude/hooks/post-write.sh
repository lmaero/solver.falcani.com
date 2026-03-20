#!/bin/bash
# falcani solver — post-write hook
# Runs linter on written files and warns about large files

FILE_PATH="$1"

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Run linter on the written file
pnpm biome check --write "$FILE_PATH" 2>/dev/null

# Warn if file exceeds 400 lines (does not block)
LINE_COUNT=$(wc -l < "$FILE_PATH" 2>/dev/null || echo "0")
LINE_COUNT=$(echo "$LINE_COUNT" | tr -d ' ')

if [ "$LINE_COUNT" -gt 400 ] 2>/dev/null; then
  echo "WARNING: $FILE_PATH has $LINE_COUNT lines (exceeds 400-line guideline). Consider splitting."
fi
