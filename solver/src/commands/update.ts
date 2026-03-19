import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Ecosystem } from "../types.js";
import { fileExists } from "../utils/files.js";
import { success, warn, info, heading, error } from "../utils/output.js";
import { generateClaudeMd } from "../templates/claude-md.js";
import { generateSettingsJson } from "../templates/settings-json.js";
import { generatePostWriteHook } from "../templates/hooks/post-write.js";
import { generatePostTestHook } from "../templates/hooks/post-test.js";
import { generateSessionEndHook } from "../templates/hooks/session-end.js";

export interface FileDiff {
  file: string;
  status: "up-to-date" | "differs" | "missing";
  current?: string;
  expected?: string;
}

interface UpdateOptions {
  ecosystem?: Ecosystem;
}

/**
 * Pure comparison function — compares each framework-generated file
 * against the current template version. No side effects.
 */
export async function compareFrameworkFiles(
  projectRoot: string,
  ecosystem: Ecosystem,
): Promise<FileDiff[]> {
  const frameworkFiles: Array<{ relativePath: string; generate: () => string }> = [
    { relativePath: "CLAUDE.md", generate: generateClaudeMd },
    { relativePath: ".claude/settings.json", generate: generateSettingsJson },
    {
      relativePath: ".claude/hooks/post-write.sh",
      generate: () => generatePostWriteHook(ecosystem),
    },
    {
      relativePath: ".claude/hooks/post-test.sh",
      generate: () => generatePostTestHook(ecosystem),
    },
    {
      relativePath: ".claude/hooks/session-end.sh",
      generate: () => generateSessionEndHook(ecosystem),
    },
  ];

  const diffs: FileDiff[] = [];

  for (const { relativePath, generate } of frameworkFiles) {
    const fullPath = join(projectRoot, relativePath);
    const expected = generate();

    if (!(await fileExists(fullPath))) {
      diffs.push({ file: relativePath, status: "missing", expected });
      continue;
    }

    const current = await readFile(fullPath, "utf-8");

    if (current === expected) {
      diffs.push({ file: relativePath, status: "up-to-date" });
    } else {
      diffs.push({ file: relativePath, status: "differs", current, expected });
    }
  }

  return diffs;
}

/**
 * Interactive update — displays comparison results and offers to apply changes.
 * Does NOT auto-apply; the human reviews and decides.
 */
export async function executeUpdate(
  projectRoot: string,
  options: UpdateOptions,
): Promise<FileDiff[]> {
  const ecosystem: Ecosystem = options.ecosystem ?? "ts";

  heading("solver update");
  info(`Ecosystem: ${ecosystem}`);

  const diffs = await compareFrameworkFiles(projectRoot, ecosystem);

  let upToDate = 0;
  let differs = 0;
  let missing = 0;

  for (const diff of diffs) {
    switch (diff.status) {
      case "up-to-date":
        success(`${diff.file} — up to date`);
        upToDate++;
        break;
      case "differs":
        warn(`${diff.file} — differs from template`);
        displaySimpleDiff(diff);
        differs++;
        break;
      case "missing":
        error(`${diff.file} — missing`);
        missing++;
        break;
    }
  }

  heading("solver update summary");
  info(`${upToDate} up to date, ${differs} differ(s), ${missing} missing`);

  if (differs > 0 || missing > 0) {
    info("Review the differences above and apply changes manually");
    info("To reset all framework files, run: solver uninstall && solver init");
  } else {
    success("All framework files are up to date");
  }

  return diffs;
}

/**
 * Displays a line-by-line comparison showing which lines were added/removed.
 */
function displaySimpleDiff(diff: FileDiff): void {
  if (!diff.current || !diff.expected) return;

  const currentLines = diff.current.split("\n");
  const expectedLines = diff.expected.split("\n");

  const maxLines = Math.max(currentLines.length, expectedLines.length);
  const diffLines: string[] = [];

  for (let i = 0; i < maxLines; i++) {
    const currentLine = currentLines[i];
    const expectedLine = expectedLines[i];

    if (currentLine === expectedLine) continue;

    if (currentLine !== undefined && expectedLine !== undefined) {
      diffLines.push(`  - ${currentLine}`);
      diffLines.push(`  + ${expectedLine}`);
    } else if (currentLine !== undefined) {
      diffLines.push(`  - ${currentLine}`);
    } else if (expectedLine !== undefined) {
      diffLines.push(`  + ${expectedLine}`);
    }
  }

  if (diffLines.length > 0) {
    // Show up to 20 diff lines to keep output manageable
    const linesToShow = diffLines.slice(0, 20);
    for (const line of linesToShow) {
      process.stdout.write(`${line}\n`);
    }
    if (diffLines.length > 20) {
      info(`  ... and ${diffLines.length - 20} more lines`);
    }
  }
}
