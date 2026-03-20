#!/bin/bash
# falcani solver — post-test hook
# Runs test files after creation

FILE_PATH="$1"

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only run if the file is a test file
if echo "$FILE_PATH" | grep -qE '\.(test|spec)\.(ts|tsx|js|jsx)$'; then
  pnpm vitest run "$FILE_PATH"
fi
