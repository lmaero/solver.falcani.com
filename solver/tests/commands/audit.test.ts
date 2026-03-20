import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { executeAudit } from "../../src/commands/audit.js";

describe("executeAudit", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-audit-cmd-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("returns passing result for clean project", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await mkdir(join(tempDir, "tests"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    await writeFile(
      join(tempDir, "tests", "app.test.ts"),
      "test('x', () => {});",
    );
    const result = await executeAudit(tempDir);
    expect(result.passing).toBe(true);
  });

  it("returns failing result when console.log found", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), 'console.log("hello");');
    const result = await executeAudit(tempDir);
    expect(result.passing).toBe(false);
    expect(result.consoleViolations).toBeGreaterThan(0);
  });

  it("produces a scorecard string", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    const result = await executeAudit(tempDir);
    expect(result.scorecard).toBeDefined();
    expect(typeof result.scorecard).toBe("string");
  });
});
