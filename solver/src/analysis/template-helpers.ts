import { basename } from "node:path";
import type { DependencyInfo, ProjectData } from "./collector.js";
import type { AuditResult } from "./scorecard.js";

export function formatDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatProjectName(projectRoot: string): string {
  return basename(projectRoot) || "unknown";
}

export function formatDependencyTable(
  dependencies: DependencyInfo[],
  devDependencies: DependencyInfo[],
): string {
  if (dependencies.length === 0 && devDependencies.length === 0) {
    return "No dependencies detected.";
  }

  const lines = ["| Dependency | Version | Type |", "| --- | --- | --- |"];
  for (const dep of dependencies) {
    lines.push(`| ${dep.name} | ${dep.version} | production |`);
  }
  for (const dep of devDependencies) {
    lines.push(`| ${dep.name} | ${dep.version} | dev |`);
  }
  return lines.join("\n");
}

export function formatLargeFilesList(
  largeFiles: {
    path: string;
    lines: number;
  }[],
): string {
  if (largeFiles.length === 0) {
    return "No files exceed 400 lines.";
  }

  const lines = ["| File | Lines |", "| --- | --- |"];
  for (const file of largeFiles) {
    lines.push(`| ${file.path} | ${file.lines} |`);
  }
  return lines.join("\n");
}

export function generateMermaidDiagram(data: ProjectData): string {
  // Parse the tree structure to extract top-level dirs and their children
  const structureLines = data.directoryStructure.split("\n");
  const topLevelDirs: {
    name: string;
    children: string[];
  }[] = [];

  let currentTopLevel: {
    name: string;
    children: string[];
  } | null = null;

  for (const line of structureLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    // Top-level entries use ├── or └── without preceding │
    const topMatch = trimmed.match(/^[├└]── (.+)\/$/);
    const childMatch = trimmed.match(/^│?\s+[├└]── (.+)\/$/);

    if (topMatch && !line.startsWith("│") && !line.startsWith("    ")) {
      currentTopLevel = {
        children: [],
        name: topMatch[1],
      };
      topLevelDirs.push(currentTopLevel);
    } else if (childMatch && currentTopLevel) {
      currentTopLevel.children.push(childMatch[1]);
    }
  }

  if (topLevelDirs.length === 0) {
    return "graph TD\n  root[Project Root]\n  root --> no_dirs[No directories detected]";
  }

  const lines: string[] = ["graph TD"];
  const projectName = formatProjectName(data.projectRoot);
  lines.push(`  root[${projectName}]`);

  for (const dir of topLevelDirs) {
    const dirId = dir.name.replace(/[^a-zA-Z0-9]/g, "_");
    lines.push(`  root --> ${dirId}[${dir.name}/]`);

    for (const child of dir.children) {
      const childId = `${dirId}_${child.replace(/[^a-zA-Z0-9]/g, "_")}`;
      lines.push(`  ${dirId} --> ${childId}[${child}/]`);
    }
  }

  // Add dependency relationships if package.json deps reference internal structure
  const hasSrc = topLevelDirs.some((d) => d.name === "src");
  const hasTests = topLevelDirs.some(
    (d) => d.name === "tests" || d.name === "test",
  );
  if (hasSrc && hasTests) {
    const testId = topLevelDirs.find(
      (d) => d.name === "tests" || d.name === "test",
    )
      ? topLevelDirs.find((d) => d.name === "tests")?.name === "tests"
        ? "tests"
        : "test"
      : "tests";
    lines.push(`  ${testId} -.->|tests| src`);
  }

  return lines.join("\n");
}

export function formatInfrastructureChecklist(data: ProjectData): string {
  const items: string[] = [];

  if (!data.hasStructuredLogging) {
    items.push(
      "- **Structured logging:** Not detected. No pino/winston/bunyan imports found in source files.",
    );
  }
  if (!data.hasEnvValidation) {
    items.push(
      "- **Environment validation:** Not detected. No env.ts or .env.example found.",
    );
  }
  if (!data.hasErrorBoundaries) {
    items.push(
      "- **Error boundaries:** Not detected. No error.tsx/error.ts files found.",
    );
  }
  if (!data.hasCiConfig) {
    items.push(
      "- **CI/CD configuration:** Not detected. No GitHub Actions, GitLab CI, Jenkins, or CircleCI config found.",
    );
  }
  if (!data.hasDockerfile) {
    items.push("- **Dockerfile:** Not detected.");
  }
  if (!data.hasOpenSpec) {
    items.push("- **OpenSpec:** Not initialized.");
  }
  if (!data.hasTests) {
    items.push("- **Tests:** No test files found.");
  }

  if (items.length === 0) {
    return "All checked infrastructure is present (structured logging, env validation, error boundaries, CI config, Dockerfile, OpenSpec, tests).";
  }

  return items.join("\n");
}

export function formatBrokenSection(
  data: ProjectData,
  auditResult: AuditResult,
): string {
  const items: string[] = [];

  if (auditResult.consoleViolations > 0) {
    items.push(
      `- **console.log violations:** ${auditResult.consoleViolations} violation${auditResult.consoleViolations !== 1 ? "s" : ""} across ${auditResult.consoleViolationFiles.length} file${auditResult.consoleViolationFiles.length !== 1 ? "s" : ""}`,
    );
    for (const file of auditResult.consoleViolationFiles) {
      items.push(`  - ${file}`);
    }
  }

  if (data.missingDependencies.length > 0) {
    items.push(
      `- **Missing dependencies:** ${data.missingDependencies.length} package${data.missingDependencies.length !== 1 ? "s" : ""} imported in source but not declared in package.json`,
    );
    for (const pkg of data.missingDependencies) {
      items.push(`  - ${pkg}`);
    }
  }

  if (data.largeFiles.length > 0) {
    items.push(
      `- **Large files (over 400 lines):** ${data.largeFiles.length} file${data.largeFiles.length !== 1 ? "s" : ""} exceed${data.largeFiles.length === 1 ? "s" : ""} the threshold`,
    );
    for (const file of data.largeFiles) {
      items.push(`  - ${file.path} (${file.lines} lines)`);
    }
  }

  const coveragePercent = Math.round(data.testCoverageRatio * 100);
  if (coveragePercent < 50) {
    items.push(
      `- **Low test coverage:** ${coveragePercent}% (${data.testFileCount} test files for ${data.sourceFileCount} source files). Target is 50% or higher.`,
    );
  }

  if (items.length === 0) {
    return "No broken patterns detected. Console usage is clean, no missing dependencies, no oversized files, and test coverage meets the 50% threshold.";
  }

  return items.join("\n");
}

export function formatImprovementSection(data: ProjectData): string {
  const items: string[] = [];

  if (data.approachingLargeFiles.length > 0) {
    items.push(
      `- **Files approaching 400-line threshold (over 300 lines):** ${data.approachingLargeFiles.length} file${data.approachingLargeFiles.length !== 1 ? "s" : ""}`,
    );
    for (const file of data.approachingLargeFiles) {
      items.push(`  - ${file.path} (${file.lines} lines)`);
    }
  }

  const coveragePercent = Math.round(data.testCoverageRatio * 100);
  if (coveragePercent < 80 && coveragePercent >= 50) {
    items.push(
      `- **Test coverage is adequate but could improve:** ${coveragePercent}% (${data.testFileCount}/${data.sourceFileCount}). Consider adding tests for uncovered modules.`,
    );
  } else if (coveragePercent < 50 && data.sourceFileCount > 0) {
    items.push(
      `- **Test coverage is low:** ${coveragePercent}% (${data.testFileCount}/${data.sourceFileCount}). Prioritize adding tests for critical business logic.`,
    );
  }

  if (items.length === 0) {
    return "No immediate improvements identified. File sizes are well within limits and test coverage is strong.";
  }

  return items.join("\n");
}

export function formatNextSteps(
  data: ProjectData,
  auditResult: AuditResult,
): string {
  const steps: string[] = [];
  let priority = 1;

  // Missing dependencies is highest priority — build is broken
  if (auditResult.missingDependencies.length > 0) {
    steps.push(
      `${priority}. **Install missing dependencies** — ${auditResult.missingDependencies.length} package${auditResult.missingDependencies.length !== 1 ? "s" : ""} imported but not declared: ${auditResult.missingDependencies.join(", ")}.`,
    );
    priority++;
  }

  // console.log is second priority — it's a hard rule violation
  if (auditResult.consoleViolations > 0) {
    steps.push(
      `${priority}. **Replace console.log with structured logging** — ${auditResult.consoleViolations} violation${auditResult.consoleViolations !== 1 ? "s" : ""} in production code. Use Pino or the project's configured logger.`,
    );
    priority++;
  }

  // Missing infrastructure is third priority
  if (!data.hasStructuredLogging) {
    steps.push(
      `${priority}. **Add structured logging** — set up Pino (or equivalent) and create lib/logger.ts.`,
    );
    priority++;
  }

  if (!data.hasEnvValidation) {
    steps.push(
      `${priority}. **Add environment validation** — create lib/env.ts with Zod schema and .env.example.`,
    );
    priority++;
  }

  if (!data.hasErrorBoundaries) {
    steps.push(
      `${priority}. **Add error boundaries** — create error.tsx at minimum at the app root.`,
    );
    priority++;
  }

  if (!data.hasCiConfig) {
    steps.push(
      `${priority}. **Set up CI/CD** — add GitHub Actions or equivalent pipeline.`,
    );
    priority++;
  }

  // Coverage is third priority
  const coveragePercent = Math.round(data.testCoverageRatio * 100);
  if (coveragePercent < 50 && data.sourceFileCount > 0) {
    steps.push(
      `${priority}. **Improve test coverage** — currently at ${coveragePercent}%. Add tests for critical paths to reach 50% minimum.`,
    );
    priority++;
  }

  // Large files are lower priority
  if (data.largeFiles.length > 0) {
    steps.push(
      `${priority}. **Split large files** — ${data.largeFiles.length} file${data.largeFiles.length !== 1 ? "s" : ""} exceed${data.largeFiles.length === 1 ? "s" : ""} 400 lines. Extract into smaller, focused modules.`,
    );
    priority++;
  }

  if (steps.length === 0) {
    return "No critical issues found. The project meets baseline engineering standards.";
  }

  return steps.join("\n");
}
