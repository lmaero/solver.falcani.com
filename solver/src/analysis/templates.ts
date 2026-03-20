import { basename } from "node:path";
import type { DependencyInfo, ProjectData } from "./collector.js";
import type { AuditResult } from "./scorecard.js";
import {
  detectConventionalCommits,
  detectInputValidation,
} from "./scorecard.js";

function formatDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatProjectName(projectRoot: string): string {
  return basename(projectRoot) || "unknown";
}

function formatDependencyTable(
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

function formatLargeFilesList(
  largeFiles: { path: string; lines: number }[],
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

function generateMermaidDiagram(data: ProjectData): string {
  // Parse the tree structure to extract top-level dirs and their children
  const structureLines = data.directoryStructure.split("\n");
  const topLevelDirs: { name: string; children: string[] }[] = [];

  let currentTopLevel: { name: string; children: string[] } | null = null;

  for (const line of structureLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    // Top-level entries use ├── or └── without preceding │
    const topMatch = trimmed.match(/^[├└]── (.+)\/$/);
    const childMatch = trimmed.match(/^│?\s+[├└]── (.+)\/$/);

    if (topMatch && !line.startsWith("│") && !line.startsWith("    ")) {
      currentTopLevel = { name: topMatch[1], children: [] };
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
  const hasTests = topLevelDirs.some((d) => d.name === "tests" || d.name === "test");
  if (hasSrc && hasTests) {
    const testId = topLevelDirs.find((d) => d.name === "tests" || d.name === "test")
      ? (topLevelDirs.find((d) => d.name === "tests")?.name === "tests" ? "tests" : "test")
      : "tests";
    lines.push(`  ${testId} -.->|tests| src`);
  }

  return lines.join("\n");
}

function formatInfrastructureChecklist(data: ProjectData): string {
  const items: string[] = [];

  if (!data.hasStructuredLogging) {
    items.push("- **Structured logging:** Not detected. No pino/winston/bunyan imports found in source files.");
  }
  if (!data.hasEnvValidation) {
    items.push("- **Environment validation:** Not detected. No env.ts or .env.example found.");
  }
  if (!data.hasErrorBoundaries) {
    items.push("- **Error boundaries:** Not detected. No error.tsx/error.ts files found.");
  }
  if (!data.hasCiConfig) {
    items.push("- **CI/CD configuration:** Not detected. No GitHub Actions, GitLab CI, Jenkins, or CircleCI config found.");
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

function formatBrokenSection(
  data: ProjectData,
  auditResult: AuditResult,
): string {
  const items: string[] = [];

  if (auditResult.consoleViolations > 0) {
    items.push(`- **console.log violations:** ${auditResult.consoleViolations} violation${auditResult.consoleViolations !== 1 ? "s" : ""} across ${auditResult.consoleViolationFiles.length} file${auditResult.consoleViolationFiles.length !== 1 ? "s" : ""}`);
    for (const file of auditResult.consoleViolationFiles) {
      items.push(`  - ${file}`);
    }
  }

  if (data.largeFiles.length > 0) {
    items.push(`- **Large files (over 400 lines):** ${data.largeFiles.length} file${data.largeFiles.length !== 1 ? "s" : ""} exceed${data.largeFiles.length === 1 ? "s" : ""} the threshold`);
    for (const file of data.largeFiles) {
      items.push(`  - ${file.path} (${file.lines} lines)`);
    }
  }

  const coveragePercent = Math.round(data.testCoverageRatio * 100);
  if (coveragePercent < 50) {
    items.push(`- **Low test coverage:** ${coveragePercent}% (${data.testFileCount} test files for ${data.sourceFileCount} source files). Target is 50% or higher.`);
  }

  if (items.length === 0) {
    return "No broken patterns detected. Console usage is clean, no oversized files, and test coverage meets the 50% threshold.";
  }

  return items.join("\n");
}

function formatImprovementSection(data: ProjectData): string {
  const items: string[] = [];

  if (data.approachingLargeFiles.length > 0) {
    items.push(`- **Files approaching 400-line threshold (over 300 lines):** ${data.approachingLargeFiles.length} file${data.approachingLargeFiles.length !== 1 ? "s" : ""}`);
    for (const file of data.approachingLargeFiles) {
      items.push(`  - ${file.path} (${file.lines} lines)`);
    }
  }

  const coveragePercent = Math.round(data.testCoverageRatio * 100);
  if (coveragePercent < 80 && coveragePercent >= 50) {
    items.push(`- **Test coverage is adequate but could improve:** ${coveragePercent}% (${data.testFileCount}/${data.sourceFileCount}). Consider adding tests for uncovered modules.`);
  } else if (coveragePercent < 50 && data.sourceFileCount > 0) {
    items.push(`- **Test coverage is low:** ${coveragePercent}% (${data.testFileCount}/${data.sourceFileCount}). Prioritize adding tests for critical business logic.`);
  }

  if (items.length === 0) {
    return "No immediate improvements identified. File sizes are well within limits and test coverage is strong.";
  }

  return items.join("\n");
}

function formatNextSteps(
  data: ProjectData,
  auditResult: AuditResult,
): string {
  const steps: string[] = [];
  let priority = 1;

  // console.log is highest priority — it's a hard rule violation
  if (auditResult.consoleViolations > 0) {
    steps.push(`${priority}. **Replace console.log with structured logging** — ${auditResult.consoleViolations} violation${auditResult.consoleViolations !== 1 ? "s" : ""} in production code. Use Pino or the project's configured logger.`);
    priority++;
  }

  // Missing infrastructure is second priority
  if (!data.hasStructuredLogging) {
    steps.push(`${priority}. **Add structured logging** — set up Pino (or equivalent) and create lib/logger.ts.`);
    priority++;
  }

  if (!data.hasEnvValidation) {
    steps.push(`${priority}. **Add environment validation** — create lib/env.ts with Zod schema and .env.example.`);
    priority++;
  }

  if (!data.hasErrorBoundaries) {
    steps.push(`${priority}. **Add error boundaries** — create error.tsx at minimum at the app root.`);
    priority++;
  }

  if (!data.hasCiConfig) {
    steps.push(`${priority}. **Set up CI/CD** — add GitHub Actions or equivalent pipeline.`);
    priority++;
  }

  // Coverage is third priority
  const coveragePercent = Math.round(data.testCoverageRatio * 100);
  if (coveragePercent < 50 && data.sourceFileCount > 0) {
    steps.push(`${priority}. **Improve test coverage** — currently at ${coveragePercent}%. Add tests for critical paths to reach 50% minimum.`);
    priority++;
  }

  // Large files are lower priority
  if (data.largeFiles.length > 0) {
    steps.push(`${priority}. **Split large files** — ${data.largeFiles.length} file${data.largeFiles.length !== 1 ? "s" : ""} exceed${data.largeFiles.length === 1 ? "s" : ""} 400 lines. Extract into smaller, focused modules.`);
    priority++;
  }

  if (steps.length === 0) {
    return "No critical issues found. The project meets baseline engineering standards.";
  }

  return steps.join("\n");
}

export function generateScanTemplate(
  data: ProjectData,
  auditResult: AuditResult,
): string {
  const name = formatProjectName(data.projectRoot);
  const date = formatDate();
  const framework = data.detectedFramework ?? "none detected";

  return `# Solver Scan — ${name}

## Date: ${date}

## Architecture Overview

\`\`\`mermaid
${generateMermaidDiagram(data)}
\`\`\`

## Stack

**Detected framework:** ${framework}

${formatDependencyTable(data.dependencies, data.devDependencies)}

## What Exists

- **Source files:** ${data.sourceFileCount}
- **Test files:** ${data.testFileCount}
- **Test coverage ratio:** ${Math.round(data.testCoverageRatio * 100)}%
- **Has CI config:** ${data.hasCiConfig ? "yes" : "no"}
- **Has Dockerfile:** ${data.hasDockerfile ? "yes" : "no"}
- **Has OpenSpec:** ${data.hasOpenSpec ? "yes" : "no"}
- **Has structured logging:** ${data.hasStructuredLogging ? "yes" : "no"}
- **Has env validation:** ${data.hasEnvValidation ? "yes" : "no"}
- **Has error boundaries:** ${data.hasErrorBoundaries ? "yes" : "no"}

### Directory Structure

\`\`\`
${data.directoryStructure}
\`\`\`

## What's Missing (engineering quality)

${formatInfrastructureChecklist(data)}

## What's Broken

${formatBrokenSection(data, auditResult)}

## What Could Be Better

### Large Files

${formatLargeFilesList(data.largeFiles)}

${formatImprovementSection(data)}

## Recommended Next Steps

${formatNextSteps(data, auditResult)}
`;
}

export async function generateReportTemplate(
  data: ProjectData,
  auditResult: AuditResult,
): Promise<string> {
  const name = formatProjectName(data.projectRoot);
  const date = formatDate();

  // Gather mechanical checks
  const commitCheck = await detectConventionalCommits(data.projectRoot);
  const hasValidation = await detectInputValidation(data.projectRoot);

  // Build patterns followed
  const patternsFollowed: string[] = [];
  if (commitCheck.total > 0 && commitCheck.conventional === commitCheck.total) {
    patternsFollowed.push(`- **Conventional commits:** All ${commitCheck.total} recent commits follow the conventional format.`);
  } else if (commitCheck.total > 0 && commitCheck.conventional > 0) {
    patternsFollowed.push(`- **Conventional commits:** ${commitCheck.conventional}/${commitCheck.total} recent commits follow the conventional format.`);
  }
  if (data.hasStructuredLogging) {
    patternsFollowed.push("- **Structured logging:** Detected (pino/winston/bunyan imports found).");
  }
  if (data.hasErrorBoundaries) {
    patternsFollowed.push("- **Error boundaries:** Detected (error.tsx/error.ts files found).");
  }
  if (hasValidation) {
    patternsFollowed.push("- **Input validation:** Schema validation library detected (Zod/Joi/Yup).");
  }
  if (data.hasEnvValidation) {
    patternsFollowed.push("- **Environment validation:** env.ts or .env.example detected.");
  }
  if (auditResult.consoleViolations === 0) {
    patternsFollowed.push("- **No console.log in production:** Clean — zero violations.");
  }

  const patternsFollowedStr = patternsFollowed.length > 0
    ? patternsFollowed.join("\n")
    : "No standard patterns were detected in the codebase.";

  // Build patterns violated
  const patternsViolated: string[] = [];
  if (auditResult.consoleViolations > 0) {
    patternsViolated.push(`- **console.log in production:** ${auditResult.consoleViolations} violation${auditResult.consoleViolations !== 1 ? "s" : ""} across ${auditResult.consoleViolationFiles.length} file${auditResult.consoleViolationFiles.length !== 1 ? "s" : ""}.`);
  }
  if (commitCheck.total > 0 && commitCheck.violations.length > 0) {
    patternsViolated.push(`- **Conventional commits:** ${commitCheck.violations.length} commit${commitCheck.violations.length !== 1 ? "s" : ""} do not follow the format.`);
    for (const msg of commitCheck.violations.slice(0, 5)) {
      patternsViolated.push(`  - "${msg}"`);
    }
  }
  if (!data.hasStructuredLogging) {
    patternsViolated.push("- **Structured logging:** Not detected. Production code should use a structured logger instead of console.");
  }
  if (!data.hasErrorBoundaries) {
    patternsViolated.push("- **Error boundaries:** Not detected. Add error.tsx at the app root minimum.");
  }
  if (!hasValidation) {
    patternsViolated.push("- **Input validation:** No schema validation library detected. Use Zod for Server Actions and Route Handlers.");
  }

  const patternsViolatedStr = patternsViolated.length > 0
    ? patternsViolated.join("\n")
    : "No pattern violations detected.";

  return `# Solver Report — ${name}

## Date: ${date}

## Audit Results

\`\`\`
${auditResult.scorecard}
\`\`\`

**Overall:** ${auditResult.passing ? "PASSING" : "FAILING"}

${
  auditResult.consoleViolationFiles.length > 0
    ? `### console.log Violations\n\n${auditResult.consoleViolationFiles.map((f) => `- ${f}`).join("\n")}`
    : ""
}

## Patterns Followed

${patternsFollowedStr}

## Patterns Violated

${patternsViolatedStr}

## What the Framework Got Right

Assessment requires human review — compare the patterns detected above against the project's actual needs and determine which standards added real value.

## What the Framework Got Wrong

Assessment requires human review — evaluate which standards added friction without proportional value for this specific project.

## Recommendations

${formatNextSteps(data, auditResult)}
`;
}

export function generateMigrateTemplate(
  data: ProjectData,
  auditResult: AuditResult,
): string {
  const name = formatProjectName(data.projectRoot);
  const date = formatDate();

  // Build "what to normalize" from audit findings
  const normalizeItems: string[] = [];

  if (auditResult.consoleViolations > 0) {
    normalizeItems.push(`- **console.log to structured logging:** ${auditResult.consoleViolations} violation${auditResult.consoleViolations !== 1 ? "s" : ""} to migrate to Pino or equivalent.`);
  }
  if (!data.hasStructuredLogging) {
    normalizeItems.push("- **Add structured logging:** Set up Pino and create lib/logger.ts.");
  }
  if (!data.hasEnvValidation) {
    normalizeItems.push("- **Add environment validation:** Create lib/env.ts with Zod schema for runtime env checks.");
  }
  if (!data.hasErrorBoundaries) {
    normalizeItems.push("- **Add error boundaries:** Create error.tsx at app root minimum.");
  }
  if (!data.hasCiConfig) {
    normalizeItems.push("- **Set up CI/CD pipeline:** Add automated linting, testing, and build verification.");
  }

  const normalizeStr = normalizeItems.length > 0
    ? normalizeItems.join("\n")
    : "No normalization needed — the project already follows the expected patterns.";

  // Build "what to accept as tracked debt"
  const debtItems: string[] = [];

  if (data.largeFiles.length > 0) {
    debtItems.push(`- **Large files:** ${data.largeFiles.length} file${data.largeFiles.length !== 1 ? "s" : ""} over 400 lines. Splitting is valuable but low risk — can be addressed incrementally.`);
  }
  const coveragePercent = Math.round(data.testCoverageRatio * 100);
  if (coveragePercent < 50 && data.sourceFileCount > 0) {
    debtItems.push(`- **Test coverage at ${coveragePercent}%:** Below the 50% target. Prioritize tests for critical business logic; legacy utility code can wait.`);
  }
  if (data.approachingLargeFiles.length > 0) {
    debtItems.push(`- **${data.approachingLargeFiles.length} file${data.approachingLargeFiles.length !== 1 ? "s" : ""} approaching 400-line limit:** Monitor but not urgent.`);
  }

  const debtStr = debtItems.length > 0
    ? debtItems.join("\n")
    : "No significant tracked debt identified.";

  return `# Migration Assessment — ${name}

## Date: ${date}

## Current Stack

${formatDependencyTable(data.dependencies, data.devDependencies)}

**Detected framework:** ${data.detectedFramework ?? "none detected"}

## Current Structure

\`\`\`
${data.directoryStructure}
\`\`\`

## File Inventory

- **Source files:** ${data.sourceFileCount}
- **Test files:** ${data.testFileCount}
- **Test coverage ratio:** ${Math.round(data.testCoverageRatio * 100)}%

### Large Files

${formatLargeFilesList(data.largeFiles)}

## Migration Assessment

Based on mechanical analysis of the codebase, the following normalizations and debt items were identified.

### What to normalize

${normalizeStr}

### What to accept as tracked debt

${debtStr}

## OpenSpec Change Proposals

${data.hasOpenSpec ? "OpenSpec is initialized. Review the spec for any structural improvements that should go through the change proposal process." : "OpenSpec is not initialized. Consider setting up OpenSpec before proposing structural changes."}

## Legacy Tolerance Boundaries

${data.detectedFramework ? `The project uses ${data.detectedFramework}. Existing patterns specific to this framework are acceptable while migration proceeds incrementally.` : "No framework detected. Establish the target framework before defining tolerance boundaries."}
`;
}
