import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { executeReport } from "../../src/commands/report.js";
import { fileExists } from "../../src/utils/files.js";

describe("executeReport", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-report-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("creates a report file", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    const result = await executeReport(tempDir);
    expect(await fileExists(result.reportPath)).toBe(true);
  });

  it("contains audit scorecard", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    const result = await executeReport(tempDir);
    const content = await readFile(result.reportPath, "utf-8");
    expect(content).toContain("Audit Results");
    expect(content).toContain("console.log");
  });

  it("contains framework assessment sections", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    const result = await executeReport(tempDir);
    const content = await readFile(result.reportPath, "utf-8");
    expect(content).toContain("What the Framework Got Right");
    expect(content).toContain("What the Framework Got Wrong");
    expect(content).toContain("Recommendations");
  });
});
