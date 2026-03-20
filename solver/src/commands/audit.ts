import {
  type AuditResult,
  runAuditChecks,
} from "../analysis/scorecard.js";
import { heading, success, error } from "../utils/output.js";

export async function executeAudit(
  projectRoot: string,
): Promise<AuditResult> {
  heading("solver audit");

  const result = await runAuditChecks(projectRoot);

  process.stdout.write(`${result.scorecard}\n`);

  if (result.passing) {
    success("audit passed");
  } else {
    error("audit failed — fix violations before proceeding");
    process.exitCode = 1;
  }

  return result;
}
