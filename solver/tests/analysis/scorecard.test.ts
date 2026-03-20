import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runAuditChecks } from "../../src/analysis/scorecard.js";

describe("runAuditChecks", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-audit-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("detects console.log violations", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), 'console.log("hello");');
    const result = await runAuditChecks(tempDir);
    expect(result.consoleViolations).toBe(1);
  });

  it("ignores console.log in test files", async () => {
    await mkdir(join(tempDir, "tests"), { recursive: true });
    await writeFile(join(tempDir, "tests", "app.test.ts"), 'console.log("debug");');
    const result = await runAuditChecks(tempDir);
    expect(result.consoleViolations).toBe(0);
  });

  it("counts files over 400 lines", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    const longContent = Array(450).fill("const x = 1;").join("\n");
    await writeFile(join(tempDir, "src", "big.ts"), longContent);
    const result = await runAuditChecks(tempDir);
    expect(result.largeFiles).toHaveLength(1);
  });

  it("calculates test coverage ratio", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await mkdir(join(tempDir, "tests"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    await writeFile(join(tempDir, "src", "util.ts"), "export const y = 2;");
    await writeFile(join(tempDir, "tests", "app.test.ts"), "test('x', () => {});");
    const result = await runAuditChecks(tempDir);
    expect(result.testCoverageRatio).toBeCloseTo(0.5);
  });

  it("produces a formatted scorecard string", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    const result = await runAuditChecks(tempDir);
    expect(result.scorecard).toContain("console.log");
    expect(result.scorecard).toContain("Test coverage");
    expect(result.scorecard).toContain("Files over 400");
  });

  it("returns passing result for clean project", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await mkdir(join(tempDir, "tests"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    await writeFile(join(tempDir, "tests", "app.test.ts"), "test('x', () => {});");
    const result = await runAuditChecks(tempDir);
    expect(result.consoleViolations).toBe(0);
    expect(result.passing).toBe(true);
  });

  it("detects console.error and console.warn violations", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "a.ts"), 'console.error("err");');
    await writeFile(join(tempDir, "src", "b.ts"), 'console.warn("warn");');
    const result = await runAuditChecks(tempDir);
    expect(result.consoleViolations).toBe(2);
    expect(result.consoleViolationFiles).toHaveLength(2);
  });

  it("detects multiple console violations in one file", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(
      join(tempDir, "src", "app.ts"),
      'console.log("a");\nconsole.log("b");\nconsole.warn("c");',
    );
    const result = await runAuditChecks(tempDir);
    expect(result.consoleViolations).toBe(3);
    expect(result.consoleViolationFiles).toHaveLength(1);
  });

  it("returns failing result when console violations exist", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), 'console.log("x");');
    const result = await runAuditChecks(tempDir);
    expect(result.passing).toBe(false);
  });

  it("detects OpenSpec presence", async () => {
    await mkdir(join(tempDir, "openspec"), { recursive: true });
    const result = await runAuditChecks(tempDir);
    expect(result.hasOpenSpec).toBe(true);
  });
});
