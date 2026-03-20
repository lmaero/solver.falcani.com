import type { ProjectData } from "./collector.js";
import type { AuditResult } from "./scorecard.js";
import {
  formatBrokenSection,
  formatDate,
  formatDependencyTable,
  formatImprovementSection,
  formatInfrastructureChecklist,
  formatLargeFilesList,
  formatNextSteps,
  formatProjectName,
  generateMermaidDiagram,
} from "./template-helpers.js";

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
