import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { executeScan } from "../../src/commands/scan.js";
import { fileExists } from "../../src/utils/files.js";

describe("executeScan", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-scan-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("creates a scan report file", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    const result = await executeScan(tempDir);
    expect(await fileExists(result.reportPath)).toBe(true);
  });

  it("report contains project data and architecture placeholder", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    const result = await executeScan(tempDir);
    const content = await readFile(result.reportPath, "utf-8");
    expect(content).toContain("Solver Scan");
    expect(content).toContain("Architecture Overview");
    expect(content).toContain("mermaid");
  });

  it("report contains stack info when package.json exists", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: { react: "^19.0.0" },
      }),
    );
    const result = await executeScan(tempDir);
    const content = await readFile(result.reportPath, "utf-8");
    expect(content).toContain("react");
  });
});
