import { writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { collectProjectData } from "../analysis/collector.js";
import { runAuditChecks } from "../analysis/scorecard.js";
import { generateScanTemplate } from "../analysis/templates.js";
import { ensureDir } from "../utils/files.js";
import { heading, success } from "../utils/output.js";

interface ScanResult {
  reportPath: string;
}

function formatDateForFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function executeScan(projectRoot: string): Promise<ScanResult> {
  heading("solver scan");

  const data = await collectProjectData(projectRoot);
  const auditResult = await runAuditChecks(projectRoot);
  const markdown = generateScanTemplate(data, auditResult);

  const docsDir = join(projectRoot, "docs");
  await ensureDir(docsDir);

  const filename = `solver-scan-${formatDateForFilename()}.md`;
  const reportPath = join(docsDir, filename);
  await writeFile(reportPath, markdown);

  success(`scan report written to docs/${filename}`);

  return { reportPath };
}
