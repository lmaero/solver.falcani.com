import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { collectProjectData } from "./collector.js";

export interface AuditResult {
  consoleViolations: number;
  consoleViolationFiles: string[];
  largeFiles: {
    path: string;
    lines: number;
  }[];
  missingDependencies: string[];
  biomeNoConsole: "active" | "missing";
  testCoverageRatio: number;
  sourceFileCount: number;
  testFileCount: number;
  hasOpenSpec: boolean;
  scorecard: string;
  passing: boolean;
}

const CONSOLE_PATTERN = /console\.(log|error|warn)\s*\(/g;

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "__pycache__",
  ".cache",
]);

const SOURCE_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "py",
  "cpp",
  "c",
  "h",
  "hpp",
  "rs",
  "go",
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

async function walkProductionFiles(
  dir: string,
  basePath = "",
): Promise<string[]> {
  const results: string[] = [];
  const entries = await readdir(dir, {
    withFileTypes: true,
  });

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

async function detectConsoleViolations(projectRoot: string): Promise<{
  count: number;
  files: string[];
}> {
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

  return {
    count,
    files: [...violationFiles].sort(),
  };
}

/**
 * Check recent git log for conventional commit format.
 * Returns { total, conventional } counts.
 */
export async function detectConventionalCommits(projectRoot: string): Promise<{
  total: number;
  conventional: number;
  violations: string[];
}> {
  const { execSync } = await import("node:child_process");
  try {
    const output = execSync("git log --oneline -20 --format=%s", {
      cwd: projectRoot,
      encoding: "utf-8",
      timeout: 5000,
    });
    const messages = output.trim().split("\n").filter(Boolean);
    const conventionalPattern =
      /^(feat|fix|chore|docs|refactor|test|ci|style|perf|build|revert)(\(.+\))?!?:/;
    const violations: string[] = [];
    let conventional = 0;

    for (const msg of messages) {
      if (conventionalPattern.test(msg)) {
        conventional++;
      } else {
        violations.push(msg);
      }
    }

    return {
      conventional,
      total: messages.length,
      violations,
    };
  } catch {
    return {
      conventional: 0,
      total: 0,
      violations: [],
    };
  }
}

/**
 * Detect if source files use schema validation (Zod, Joi, Yup, etc.)
 */
export async function detectInputValidation(
  projectRoot: string,
): Promise<boolean> {
  const files = await walkProductionFiles(projectRoot);
  for (const relativePath of files) {
    if (isTestFile(relativePath) || !isSourceFile(relativePath)) {
      continue;
    }
    const fullPath = join(projectRoot, relativePath);
    try {
      const content = await readFile(fullPath, "utf-8");
      if (
        content.includes('from "zod"') ||
        content.includes("from 'zod'") ||
        content.includes('from "joi"') ||
        content.includes("from 'joi'") ||
        content.includes('from "yup"') ||
        content.includes("from 'yup'")
      ) {
        return true;
      }
    } catch {
      // Skip
    }
  }
  return false;
}

function formatScorecard(
  result: Omit<AuditResult, "scorecard" | "passing">,
): string {
  const lines: string[] = [];

  const consoleStatus = result.consoleViolations === 0 ? "\u2713" : "\u2717";
  const consoleLabel = "console.log in production:";
  const consoleValue = `${result.consoleViolations} violation${result.consoleViolations !== 1 ? "s" : ""}`;
  lines.push(
    `${consoleLabel.padEnd(35)}${consoleValue.padEnd(20)}${consoleStatus}`,
  );

  const coveragePercent = Math.round(result.testCoverageRatio * 100);
  const coverageStatus = coveragePercent >= 50 ? "\u2713" : "\u26A0";
  const coverageLabel = "Test coverage:";
  const coverageValue = `${coveragePercent}% (${result.testFileCount}/${result.sourceFileCount})`;
  lines.push(
    `${coverageLabel.padEnd(35)}${coverageValue.padEnd(20)}${coverageStatus}`,
  );

  const largeFileCount = result.largeFiles.length;
  const largeFilesStatus = largeFileCount === 0 ? "\u2713" : "\u26A0";
  const largeFilesLabel = "Files over 400 lines:";
  const largeFilesValue = `${largeFileCount}`;
  lines.push(
    `${largeFilesLabel.padEnd(35)}${largeFilesValue.padEnd(20)}${largeFilesStatus}`,
  );

  const missingDepCount = result.missingDependencies.length;
  const missingDepStatus = missingDepCount === 0 ? "\u2713" : "\u2717";
  const missingDepLabel = "Missing dependencies:";
  const missingDepValue =
    missingDepCount === 0
      ? "none"
      : `${missingDepCount} package${missingDepCount !== 1 ? "s" : ""}`;
  lines.push(
    `${missingDepLabel.padEnd(35)}${missingDepValue.padEnd(20)}${missingDepStatus}`,
  );

  const biomeStatus = result.biomeNoConsole === "active" ? "\u2713" : "\u26A0";
  const biomeLabel = "Biome noConsole rule:";
  const biomeValue = result.biomeNoConsole;
  lines.push(`${biomeLabel.padEnd(35)}${biomeValue.padEnd(20)}${biomeStatus}`);

  const openSpecStatus = result.hasOpenSpec ? "\u2713" : "\u26A0";
  const openSpecLabel = "OpenSpec initialized:";
  const openSpecValue = result.hasOpenSpec ? "yes" : "no";
  lines.push(
    `${openSpecLabel.padEnd(35)}${openSpecValue.padEnd(20)}${openSpecStatus}`,
  );

  return lines.join("\n");
}

export async function checkBiomeNoConsole(
  projectRoot: string,
): Promise<"active" | "missing"> {
  const biomePath = join(projectRoot, "biome.json");
  try {
    const content = await readFile(biomePath, "utf-8");
    const config = JSON.parse(content);
    const noConsole = config?.linter?.rules?.suspicious?.noConsole;
    return noConsole === "error" ? "active" : "missing";
  } catch {
    return "missing";
  }
}

export async function runAuditChecks(
  projectRoot: string,
): Promise<AuditResult> {
  const projectData = await collectProjectData(projectRoot);

  const [
    { count: consoleViolations, files: consoleViolationFiles },
    biomeNoConsole,
  ] = await Promise.all([
    detectConsoleViolations(projectRoot),
    checkBiomeNoConsole(projectRoot),
  ]);

  const partialResult = {
    biomeNoConsole,
    consoleViolationFiles,
    consoleViolations,
    hasOpenSpec: projectData.hasOpenSpec,
    largeFiles: projectData.largeFiles,
    missingDependencies: projectData.missingDependencies,
    sourceFileCount: projectData.sourceFileCount,
    testCoverageRatio: projectData.testCoverageRatio,
    testFileCount: projectData.testFileCount,
  };

  const scorecard = formatScorecard(partialResult);
  const passing =
    consoleViolations === 0 && projectData.missingDependencies.length === 0;

  return {
    ...partialResult,
    passing,
    scorecard,
  };
}
