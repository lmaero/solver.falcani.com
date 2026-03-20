import { mkdtemp, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { executeInit } from "../../src/commands/init.js";
import { compareFrameworkFiles } from "../../src/commands/update.js";

describe("compareFrameworkFiles", { timeout: 60_000 }, () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-update-"));
    await executeInit(tempDir, { ecosystem: "ts" }, false);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("reports no changes when files match templates", async () => {
    const diffs = await compareFrameworkFiles(tempDir, "ts");
    const hasChanges = diffs.some((d) => d.status === "differs");
    expect(hasChanges).toBe(false);
  });

  it("detects when CLAUDE.md has been modified", async () => {
    await writeFile(join(tempDir, "CLAUDE.md"), "# modified");
    const diffs = await compareFrameworkFiles(tempDir, "ts");
    const claudeDiff = diffs.find((d) => d.file === "CLAUDE.md");
    expect(claudeDiff?.status).toBe("differs");
  });

  it("detects when a file is missing", async () => {
    await unlink(join(tempDir, "CLAUDE.md"));
    const diffs = await compareFrameworkFiles(tempDir, "ts");
    const claudeDiff = diffs.find((d) => d.file === "CLAUDE.md");
    expect(claudeDiff?.status).toBe("missing");
  });

  it("detects when settings.json has been modified", async () => {
    await writeFile(
      join(tempDir, ".claude", "settings.json"),
      '{"custom": true}',
    );
    const diffs = await compareFrameworkFiles(tempDir, "ts");
    const settingsDiff = diffs.find((d) => d.file === ".claude/settings.json");
    expect(settingsDiff?.status).toBe("differs");
  });
});
