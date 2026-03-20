import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileExists } from "../utils/files.js";

export interface ProjectData {
  projectRoot: string;
  fileCounts: Record<string, number>;
  sourceFileCount: number;
  testFileCount: number;
  testCoverageRatio: number;
  dependencies: string[];
  devDependencies: string[];
  detectedFramework: string | null;
  largeFiles: { path: string; lines: number }[];
  directoryStructure: string[];
  hasOpenSpec: boolean;
  hasCiConfig: boolean;
  hasDockerfile: boolean;
  hasTests: boolean;
}

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
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".cpp",
  ".c",
  ".h",
  ".hpp",
  ".rs",
  ".go",
]);

const FRAMEWORK_DETECTION_ORDER: [string, string][] = [
  ["next", "next"],
  ["@angular/core", "angular"],
  ["vue", "vue"],
  ["svelte", "svelte"],
  ["vite", "vite"],
  ["express", "express"],
  ["fastify", "fastify"],
  ["koa", "koa"],
];

const LARGE_FILE_THRESHOLD = 400;

function isTestFile(filePath: string): boolean {
  const name = filePath.split("/").pop() ?? "";
  if (name.includes(".test.") || name.includes(".spec.")) {
    return true;
  }
  return filePath.includes("__tests__/");
}

async function walkDirectory(
  dir: string,
  projectRoot: string,
  files: string[],
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await walkDirectory(fullPath, projectRoot, files);
    } else if (entry.isFile()) {
      files.push(relative(projectRoot, fullPath));
    }
  }
}

async function collectDirectoryStructure(
  projectRoot: string,
): Promise<string[]> {
  const dirs: string[] = [];

  const topEntries = await readdir(projectRoot, { withFileTypes: true });
  for (const entry of topEntries) {
    if (!entry.isDirectory() || EXCLUDED_DIRS.has(entry.name) || entry.name.startsWith(".")) {
      continue;
    }
    dirs.push(entry.name);

    const secondLevelPath = join(projectRoot, entry.name);
    try {
      const secondEntries = await readdir(secondLevelPath, { withFileTypes: true });
      for (const subEntry of secondEntries) {
        if (!subEntry.isDirectory() || EXCLUDED_DIRS.has(subEntry.name)) {
          continue;
        }
        dirs.push(`${entry.name}/${subEntry.name}`);
      }
    } catch {
      // Directory may not be readable, skip
    }
  }

  return dirs.sort();
}

function detectFramework(
  dependencies: string[],
  devDependencies: string[],
): string | null {
  const allDeps = new Set([...dependencies, ...devDependencies]);

  for (const [depName, frameworkName] of FRAMEWORK_DETECTION_ORDER) {
    if (allDeps.has(depName)) {
      return frameworkName;
    }
  }

  return null;
}

async function countFileLines(filePath: string): Promise<number> {
  const content = await readFile(filePath, "utf-8");
  return content.split("\n").length;
}

export async function collectProjectData(
  projectRoot: string,
): Promise<ProjectData> {
  const files: string[] = [];
  await walkDirectory(projectRoot, projectRoot, files);

  const fileCounts: Record<string, number> = {};
  let sourceFileCount = 0;
  let testFileCount = 0;
  const largeFiles: { path: string; lines: number }[] = [];

  for (const relativePath of files) {
    const ext = extname(relativePath);
    if (ext) {
      const extKey = ext.slice(1); // Remove leading dot
      fileCounts[extKey] = (fileCounts[extKey] ?? 0) + 1;
    }

    const isSource = SOURCE_EXTENSIONS.has(ext);
    const isTest = isTestFile(relativePath);

    if (isTest) {
      testFileCount++;
    } else if (isSource) {
      sourceFileCount++;
    }

    // Check line count for source files (both test and non-test)
    if (isSource || isTest) {
      const fullPath = join(projectRoot, relativePath);
      const lineCount = await countFileLines(fullPath);
      if (lineCount > LARGE_FILE_THRESHOLD) {
        largeFiles.push({ path: relativePath, lines: lineCount });
      }
    }
  }

  // Read package.json
  let dependencies: string[] = [];
  let devDependencies: string[] = [];
  const packageJsonPath = join(projectRoot, "package.json");
  const hasPackageJson = await fileExists(packageJsonPath);

  if (hasPackageJson) {
    try {
      const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
      dependencies = Object.keys(packageJson.dependencies ?? {});
      devDependencies = Object.keys(packageJson.devDependencies ?? {});
    } catch {
      // Malformed package.json, skip
    }
  }

  const detectedFramework = detectFramework(dependencies, devDependencies);
  const directoryStructure = await collectDirectoryStructure(projectRoot);

  const [hasOpenSpec, hasDockerfile] = await Promise.all([
    fileExists(join(projectRoot, "openspec")),
    fileExists(join(projectRoot, "Dockerfile")),
  ]);

  const hasCiConfig = await detectCiConfig(projectRoot);

  const testCoverageRatio = sourceFileCount > 0 ? testFileCount / sourceFileCount : 0;

  return {
    projectRoot,
    fileCounts,
    sourceFileCount,
    testFileCount,
    testCoverageRatio,
    dependencies,
    devDependencies,
    detectedFramework,
    largeFiles,
    directoryStructure,
    hasOpenSpec,
    hasCiConfig,
    hasDockerfile,
    hasTests: testFileCount > 0,
  };
}

async function detectCiConfig(projectRoot: string): Promise<boolean> {
  const checks = await Promise.all([
    fileExists(join(projectRoot, ".github", "workflows")),
    fileExists(join(projectRoot, ".gitlab-ci.yml")),
    fileExists(join(projectRoot, "Jenkinsfile")),
    fileExists(join(projectRoot, ".circleci")),
  ]);

  return checks.some(Boolean);
}
