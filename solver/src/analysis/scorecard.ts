import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { collectProjectData } from "./collector.js";

export interface AuditResult {
  consoleViolations: number;
  consoleViolationFiles: string[];
  largeFiles: { path: string; lines: number }[];
  testCoverageRatio: number;
  sourceFileCount: number;
  testFileCount: number;
  hasOpenSpec: boolean;
  scorecard: string;
  passing: boolean;
}

const CONSOLE_PATTERN = /console\.(log|error|warn)\s*\(/g;

const EXCLUDED_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", "__pycache__", ".cache",
]);

const SOURCE_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs",
  "py", "cpp", "c", "h", "hpp", "rs", "go",
]);

function isTestFile(filePath: string): boolean {
  const name = filePath.split("/").pop() ?? "";
  if (name.includes(".test.") || name.includes(".spec.")) {
    return true;
  }
  return filePath.includes("__tests__/");
}

function isSourceFile(filePath: string): boolean {
  const ext = filePath.split(".").pop() ?? "";
  return SOURCE_EXTENSIONS.has(ext);
}

async function walkProductionFiles(dir: string, basePath = ""): Promise<string[]> {
  const results: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) {
      continue;
    }

    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      const subFiles = await walkProductionFiles(fullPath, relativePath);
      results.push(...subFiles);
    } else if (entry.isFile()) {
      results.push(relativePath);
    }
  }

  return results;
}

async function detectConsoleViolations(
  projectRoot: string,
): Promise<{ count: number; files: string[] }> {
  let count = 0;
  const violationFiles = new Set<string>();

  const files = await walkProductionFiles(projectRoot);

  for (const relativePath of files) {
    if (isTestFile(relativePath) || !isSourceFile(relativePath)) {
      continue;
    }

    const fullPath = join(projectRoot, relativePath);
    try {
      const content = await readFile(fullPath, "utf-8");
      const matches = content.match(CONSOLE_PATTERN);
      if (matches && matches.length > 0) {
        count += matches.length;
        violationFiles.add(relativePath);
      }
    } catch {
      // File may not be readable, skip
    }
  }

  return { count, files: [...violationFiles].sort() };
}

function formatScorecard(result: Omit<AuditResult, "scorecard" | "passing">): string {
  const lines: string[] = [];

  const consoleStatus = result.consoleViolations === 0 ? "\u2713" : "\u2717";
  const consoleLabel = "console.log in production:";
  const consoleValue = `${result.consoleViolations} violation${result.consoleViolations !== 1 ? "s" : ""}`;
  lines.push(`${consoleLabel.padEnd(35)}${consoleValue.padEnd(20)}${consoleStatus}`);

  const coveragePercent = Math.round(result.testCoverageRatio * 100);
  const coverageStatus = coveragePercent >= 50 ? "\u2713" : "\u26A0";
  const coverageLabel = "Test coverage:";
  const coverageValue = `${coveragePercent}% (${result.testFileCount}/${result.sourceFileCount})`;
  lines.push(`${coverageLabel.padEnd(35)}${coverageValue.padEnd(20)}${coverageStatus}`);

  const largeFileCount = result.largeFiles.length;
  const largeFilesStatus = largeFileCount === 0 ? "\u2713" : "\u26A0";
  const largeFilesLabel = "Files over 400 lines:";
  const largeFilesValue = `${largeFileCount}`;
  lines.push(`${largeFilesLabel.padEnd(35)}${largeFilesValue.padEnd(20)}${largeFilesStatus}`);

  const openSpecStatus = result.hasOpenSpec ? "\u2713" : "\u26A0";
  const openSpecLabel = "OpenSpec initialized:";
  const openSpecValue = result.hasOpenSpec ? "yes" : "no";
  lines.push(`${openSpecLabel.padEnd(35)}${openSpecValue.padEnd(20)}${openSpecStatus}`);

  return lines.join("\n");
}

export async function runAuditChecks(projectRoot: string): Promise<AuditResult> {
  const projectData = await collectProjectData(projectRoot);

  const { count: consoleViolations, files: consoleViolationFiles } =
    await detectConsoleViolations(projectRoot);

  const partialResult = {
    consoleViolations,
    consoleViolationFiles,
    largeFiles: projectData.largeFiles,
    testCoverageRatio: projectData.testCoverageRatio,
    sourceFileCount: projectData.sourceFileCount,
    testFileCount: projectData.testFileCount,
    hasOpenSpec: projectData.hasOpenSpec,
  };

  const scorecard = formatScorecard(partialResult);
  const passing = consoleViolations === 0;

  return {
    ...partialResult,
    scorecard,
    passing,
  };
}
