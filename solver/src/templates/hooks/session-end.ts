import type { Ecosystem } from "../../types.js";

const TYPE_CHECK_COMMANDS: Record<Ecosystem, string> = {
  cpp: "cmake --build build --target check 2>/dev/null || echo 'No type check target configured'",
  ts: "pnpm tsc --noEmit",
};

export function generateSessionEndHook(ecosystem: Ecosystem): string {
  const typeCheckCommand = TYPE_CHECK_COMMANDS[ecosystem];

  return `#!/bin/bash
# falcani solver — session-end hook
# Runs type checking before session ends

echo "Running type check..."
${typeCheckCommand}
`;
}
