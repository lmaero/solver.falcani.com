import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { collectProjectData } from "../analysis/collector.js";
import { generateMigrateTemplate } from "../analysis/migrate-template.js";
import { runAuditChecks } from "../analysis/scorecard.js";
import { ensureDir } from "../utils/files.js";
import { heading, success } from "../utils/output.js";

interface MigrateResult {
  reportPath: string;
}

function formatDateForFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function executeMigrate(
  projectRoot: string,
): Promise<MigrateResult> {
  heading("solver migrate");

  const data = await collectProjectData(projectRoot);
  const auditResult = await runAuditChecks(projectRoot);
  const markdown = generateMigrateTemplate(data, auditResult);

  const docsDir = join(projectRoot, "docs");
  await ensureDir(docsDir);

  const filename = `solver-migrate-${formatDateForFilename()}.md`;
  const reportPath = join(docsDir, filename);
  await writeFile(reportPath, markdown);

  success(`migration assessment written to docs/${filename}`);

  return {
    reportPath,
  };
}
