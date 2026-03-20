import type { Ecosystem } from "../../types.js";

const TEST_RUNNERS: Record<Ecosystem, string> = {
  cpp: "ctest --test-dir build",
  ts: "pnpm vitest run",
};

const TEST_PATTERNS: Record<Ecosystem, string> = {
  cpp: "_(test|spec)\\.cpp$",
  ts: "\\.(test|spec)\\.(ts|tsx|js|jsx)$",
};

export function generatePostTestHook(ecosystem: Ecosystem): string {
  const testRunner = TEST_RUNNERS[ecosystem];
  const testPattern = TEST_PATTERNS[ecosystem];

  return `#!/bin/bash
# falcani solver — post-test hook
# Runs test files after creation

FILE_PATH="$1"

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only run if the file is a test file
if echo "$FILE_PATH" | grep -qE '${testPattern}'; then
  ${testRunner} "$FILE_PATH"
fi
`;
}
