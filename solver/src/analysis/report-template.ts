import type { ProjectData } from "./collector.js";
import type { AuditResult } from "./scorecard.js";
import {
  detectConventionalCommits,
  detectInputValidation,
} from "./scorecard.js";
import {
  formatDate,
  formatNextSteps,
  formatProjectName,
} from "./template-helpers.js";

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
