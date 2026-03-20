import type { ProjectData } from "./collector.js";
import type { AuditResult } from "./scorecard.js";
import {
  formatDate,
  formatDependencyTable,
  formatLargeFilesList,
  formatProjectName,
} from "./template-helpers.js";

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
