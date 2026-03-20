import { join } from "node:path";
import type { ProjectState } from "../types.js";
import { fileExists } from "./files.js";

export async function detectProjectState(
  projectRoot: string,
): Promise<ProjectState> {
  const [hasClaudeMd, hasClaudeDir, hasOpenSpec, hasBiomeJson, hasPackageJson] =
    await Promise.all([
      fileExists(join(projectRoot, "CLAUDE.md")),
      fileExists(join(projectRoot, ".claude")),
      fileExists(join(projectRoot, "openspec")),
      fileExists(join(projectRoot, "biome.json")),
      fileExists(join(projectRoot, "package.json")),
    ]);

  return {
    hasClaudeMd,
    hasClaudeDir,
    hasOpenSpec,
    hasBiomeJson,
    hasPackageJson,
    projectRoot,
  };
}
