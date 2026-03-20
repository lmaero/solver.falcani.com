import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileExists } from "../utils/files.js";

export interface DependencyInfo {
  name: string;
  version: string;
}

export interface ProjectData {
  projectRoot: string;
  fileCounts: Record<string, number>;
  sourceFileCount: number;
  testFileCount: number;
  testCoverageRatio: number;
  dependencies: DependencyInfo[];
  devDependencies: DependencyInfo[];
  detectedFramework: string | null;
  largeFiles: { path: string; lines: number }[];
  approachingLargeFiles: { path: string; lines: number }[];
  directoryStructure: string;
  hasOpenSpec: boolean;
  hasCiConfig: boolean;
  hasDockerfile: boolean;
  hasTests: boolean;
  hasStructuredLogging: boolean;
  hasEnvValidation: boolean;
  hasErrorBoundaries: boolean;
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
const APPROACHING_LARGE_THRESHOLD = 300;

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

interface DirectoryNode {
  name: string;
  children: DirectoryNode[];
}

async function collectDirectoryTree(
  dir: string,
  depth: number,
): Promise<DirectoryNode[]> {
  if (depth <= 0) {
    return [];
  }

  const entries = await readdir(dir, { withFileTypes: true });
  const nodes: DirectoryNode[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || EXCLUDED_DIRS.has(entry.name) || entry.name.startsWith(".")) {
      continue;
    }

    const children = await collectDirectoryTree(join(dir, entry.name), depth - 1);
    nodes.push({ name: entry.name, children });
  }

  return nodes.sort((a, b) => a.name.localeCompare(b.name));
}

function formatDirectoryTree(nodes: DirectoryNode[], prefix: string): string {
  const lines: string[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isLast = i === nodes.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = isLast ? "    " : "│   ";

    lines.push(`${prefix}${connector}${node.name}/`);

    if (node.children.length > 0) {
      lines.push(formatDirectoryTree(node.children, `${prefix}${childPrefix}`));
    }
  }

  return lines.join("\n");
}

function detectFramework(
  dependencies: DependencyInfo[],
  devDependencies: DependencyInfo[],
): string | null {
  const allDepNames = new Set([
    ...dependencies.map((d) => d.name),
    ...devDependencies.map((d) => d.name),
  ]);

  for (const [depName, frameworkName] of FRAMEWORK_DETECTION_ORDER) {
    if (allDepNames.has(depName)) {
      return frameworkName;
    }
  }

  return null;
}

async function countFileLines(filePath: string): Promise<number> {
  const content = await readFile(filePath, "utf-8");
  return content.split("\n").length;
}

async function detectStructuredLoggingInFiles(
  projectRoot: string,
  files: string[],
): Promise<boolean> {
  for (const relativePath of files) {
    const ext = extname(relativePath);
    if (!SOURCE_EXTENSIONS.has(ext)) {
      continue;
    }

    const fullPath = join(projectRoot, relativePath);
    try {
      const content = await readFile(fullPath, "utf-8");
      if (content.includes("from \"pino\"") || content.includes("from 'pino'") ||
          content.includes("require(\"pino\")") || content.includes("require('pino')") ||
          content.includes("from \"winston\"") || content.includes("from 'winston'") ||
          content.includes("from \"bunyan\"") || content.includes("from 'bunyan'")) {
        return true;
      }
    } catch {
      // Skip unreadable files
    }
  }
  return false;
}

async function detectEnvValidationInFiles(
  projectRoot: string,
  files: string[],
): Promise<boolean> {
  for (const relativePath of files) {
    const name = relativePath.split("/").pop() ?? "";
    if (name === "env.ts" || name === "env.js" || name === "env.mjs") {
      return true;
    }
  }

  // Also check for .env.example as a signal of env awareness
  return fileExists(join(projectRoot, ".env.example"));
}

async function detectErrorBoundariesInFiles(
  files: string[],
): Promise<boolean> {
  for (const relativePath of files) {
    const name = relativePath.split("/").pop() ?? "";
    if (name === "error.tsx" || name === "error.ts" || name === "error.jsx" || name === "error.js") {
      return true;
    }
  }
  return false;
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
  const approachingLargeFiles: { path: string; lines: number }[] = [];

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
      } else if (lineCount > APPROACHING_LARGE_THRESHOLD) {
        approachingLargeFiles.push({ path: relativePath, lines: lineCount });
      }
    }
  }

  // Read package.json
  let dependencies: DependencyInfo[] = [];
  let devDependencies: DependencyInfo[] = [];
  const packageJsonPath = join(projectRoot, "package.json");
  const hasPackageJson = await fileExists(packageJsonPath);

  if (hasPackageJson) {
    try {
      const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
      dependencies = Object.entries(packageJson.dependencies ?? {}).map(
        ([name, version]) => ({ name, version: version as string }),
      );
      devDependencies = Object.entries(packageJson.devDependencies ?? {}).map(
        ([name, version]) => ({ name, version: version as string }),
      );
    } catch {
      // Malformed package.json, skip
    }
  }

  const detectedFramework = detectFramework(dependencies, devDependencies);

  // Build tree-formatted directory structure
  const dirNodes = await collectDirectoryTree(projectRoot, 2);
  const directoryStructure = dirNodes.length > 0
    ? formatDirectoryTree(dirNodes, "")
    : "No directories detected.";

  const [hasOpenSpec, hasDockerfile] = await Promise.all([
    fileExists(join(projectRoot, "openspec")),
    fileExists(join(projectRoot, "Dockerfile")),
  ]);

  const hasCiConfig = await detectCiConfig(projectRoot);
  const hasStructuredLogging = await detectStructuredLoggingInFiles(projectRoot, files);
  const hasEnvValidation = await detectEnvValidationInFiles(projectRoot, files);
  const hasErrorBoundaries = await detectErrorBoundariesInFiles(files);

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
    approachingLargeFiles,
    directoryStructure,
    hasOpenSpec,
    hasCiConfig,
    hasDockerfile,
    hasTests: testFileCount > 0,
    hasStructuredLogging,
    hasEnvValidation,
    hasErrorBoundaries,
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
