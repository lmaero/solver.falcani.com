import { basename } from "node:path";
import type { ProjectData } from "./collector.js";
import type { AuditResult } from "./scorecard.js";

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

function formatDependencyTable(dependencies: string[]): string {
  if (dependencies.length === 0) {
    return "No dependencies detected.";
  }

  const lines = ["| Dependency | Type |", "| --- | --- |"];
  for (const dep of dependencies) {
    lines.push(`| ${dep} | production |`);
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

function formatDirectoryStructure(dirs: string[]): string {
  if (dirs.length === 0) {
    return "No directories detected.";
  }

  return dirs.map((dir) => `- ${dir}`).join("\n");
}

export function generateScanTemplate(data: ProjectData): string {
  const name = formatProjectName(data.projectRoot);
  const date = formatDate();
  const framework = data.detectedFramework ?? "none detected";

  return `# Solver Scan — ${name}

## Date: ${date}

## Architecture Overview

\`\`\`mermaid
graph TD
  [Agent: analyze codebase and fill in architecture diagram]
\`\`\`

## Data Flow

\`\`\`mermaid
sequenceDiagram
  [Agent: analyze typical request path and fill in]
\`\`\`

## Stack

**Detected framework:** ${framework}

${formatDependencyTable(data.dependencies)}

## What Exists

- **Source files:** ${data.sourceFileCount}
- **Test files:** ${data.testFileCount}
- **Test coverage ratio:** ${Math.round(data.testCoverageRatio * 100)}%
- **Has CI config:** ${data.hasCiConfig ? "yes" : "no"}
- **Has Dockerfile:** ${data.hasDockerfile ? "yes" : "no"}
- **Has OpenSpec:** ${data.hasOpenSpec ? "yes" : "no"}

### Directory Structure

${formatDirectoryStructure(data.directoryStructure)}

## What's Missing (engineering quality)

[Agent: analyze the codebase for missing engineering fundamentals — input validation, error handling, logging, testing gaps, missing types, security concerns]

## What's Broken

[Agent: identify broken patterns, dead code, misconfigured tooling, failing tests, incorrect abstractions]

## What Could Be Better

### Large Files

${formatLargeFilesList(data.largeFiles)}

[Agent: identify areas for improvement — performance, code organization, developer experience, patterns that don't scale]

## Recommended Next Steps

[Agent: prioritize concrete actions based on findings above — what to fix first, what can wait, what needs discussion]
`;
}

export function generateReportTemplate(
  data: ProjectData,
  auditResult: AuditResult,
): string {
  const name = formatProjectName(data.projectRoot);
  const date = formatDate();

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

## What Was Built

[Agent: summarize what was built in this session — features, components, infrastructure changes]

## Patterns Followed

[Agent: list falcani framework patterns that were correctly applied — Server Actions with ActionResult, Zod validation, Pino logging, error boundaries, etc.]

## Patterns Violated

[Agent: list patterns that were skipped or incorrectly applied, with reasoning for why they were violated if intentional]

## What the Framework Got Right

[Agent: assess which framework standards added real value to this project — what prevented bugs, improved DX, or enforced quality]

## What the Framework Got Wrong

[Agent: assess which framework standards added friction without proportional value — over-engineering, unnecessary abstractions, patterns that didn't fit]

## Recommendations

[Agent: concrete next steps — what to fix, what to refactor, what standards to revisit based on this project's experience]
`;
}

export function generateMigrateTemplate(data: ProjectData): string {
  const name = formatProjectName(data.projectRoot);
  const date = formatDate();

  return `# Migration Assessment — ${name}

## Date: ${date}

## Current Stack

${formatDependencyTable(data.dependencies)}

**Detected framework:** ${data.detectedFramework ?? "none detected"}

## Current Structure

${formatDirectoryStructure(data.directoryStructure)}

## File Inventory

- **Source files:** ${data.sourceFileCount}
- **Test files:** ${data.testFileCount}
- **Test coverage ratio:** ${Math.round(data.testCoverageRatio * 100)}%

### Large Files

${formatLargeFilesList(data.largeFiles)}

## Migration Assessment

[Agent: assess what patterns to normalize to falcani standards vs. what to accept as tracked debt — consider effort, risk, and value of each change]

### What to normalize

[Agent: list patterns that should be migrated to falcani standards — console.log to Pino, custom validation to Zod, etc.]

### What to accept as tracked debt

[Agent: list patterns that are acceptable to keep temporarily — legacy code that works, patterns with high migration risk, low-value changes]

## OpenSpec Change Proposals

[Agent: suggest changes as opsx:propose candidates — structural improvements that should go through the change proposal process]

## Legacy Tolerance Boundaries

[Agent: define which old patterns are temporarily accepted and under what conditions — e.g., "existing Express routes are acceptable until the API layer is rebuilt"]
`;
}
