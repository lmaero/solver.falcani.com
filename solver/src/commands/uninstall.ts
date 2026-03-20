import { rm } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../utils/files.js";
import { heading, info, success } from "../utils/output.js";

/** Files and directories that belong to the solver framework and should be removed */
const FRAMEWORK_TARGETS = [
  {
    path: "CLAUDE.md",
    type: "file" as const,
  },
  {
    path: join(".claude", "hooks"),
    type: "directory" as const,
  },
  {
    path: join(".claude", "skills"),
    type: "directory" as const,
  },
  {
    path: join(".claude", "settings.json"),
    type: "file" as const,
  },
] as const;

interface UninstallResult {
  removed: string[];
  skipped: string[];
}

export async function executeUninstall(
  projectRoot: string,
): Promise<UninstallResult> {
  heading("solver uninstall");

  const removed: string[] = [];
  const skipped: string[] = [];

  for (const target of FRAMEWORK_TARGETS) {
    const fullPath = join(projectRoot, target.path);
    const exists = await fileExists(fullPath);

    if (!exists) {
      info(`${target.path} not found — skipping`);
      skipped.push(target.path);
      continue;
    }

    await rm(fullPath, {
      recursive: target.type === "directory",
    });
    success(`Removed ${target.path}`);
    removed.push(target.path);
  }

  heading("solver uninstall complete");

  if (removed.length === 0) {
    info("No framework files found — nothing to remove");
  } else {
    success(`Removed ${removed.length} framework target(s)`);
  }

  return {
    removed,
    skipped,
  };
}
