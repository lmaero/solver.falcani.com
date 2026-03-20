import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { executeInit } from "../../src/commands/init.js";
import { mkdtemp, rm, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileExists } from "../../src/utils/files.js";

describe("executeInit", { timeout: 60_000 }, () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-init-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("creates CLAUDE.md in empty project", async () => {
    await executeInit(tempDir, { ecosystem: "ts" }, false);
    expect(await fileExists(join(tempDir, "CLAUDE.md"))).toBe(true);
  });

  it("creates .claude/settings.json", async () => {
    await executeInit(tempDir, { ecosystem: "ts" }, false);
    expect(await fileExists(join(tempDir, ".claude", "settings.json"))).toBe(true);
  });

  it("creates .claude/hooks directory with 3 hooks", async () => {
    await executeInit(tempDir, { ecosystem: "ts" }, false);
    expect(await fileExists(join(tempDir, ".claude", "hooks", "post-write.sh"))).toBe(true);
    expect(await fileExists(join(tempDir, ".claude", "hooks", "post-test.sh"))).toBe(true);
    expect(await fileExists(join(tempDir, ".claude", "hooks", "session-end.sh"))).toBe(true);
  });

  it("creates biome.json for ts ecosystem", async () => {
    await executeInit(tempDir, { ecosystem: "ts" }, false);
    expect(await fileExists(join(tempDir, "biome.json"))).toBe(true);
  });

  it("creates vitest.config.ts for ts ecosystem", async () => {
    await executeInit(tempDir, { ecosystem: "ts" }, false);
    expect(await fileExists(join(tempDir, "vitest.config.ts"))).toBe(true);
  });

  it("creates lib/logger.ts for ts ecosystem", async () => {
    await executeInit(tempDir, { ecosystem: "ts" }, false);
    expect(await fileExists(join(tempDir, "lib", "logger.ts"))).toBe(true);
  });

  it("creates docs/solver-ts-recommendations.md for ts ecosystem", async () => {
    await executeInit(tempDir, { ecosystem: "ts" }, false);
    expect(await fileExists(join(tempDir, "docs", "solver-ts-recommendations.md"))).toBe(true);
  });

  it("skips OpenSpec init if openspec/ exists", async () => {
    await mkdir(join(tempDir, "openspec"));
    const result = await executeInit(tempDir, { ecosystem: "ts" }, false);
    expect(result.openspecSkipped).toBe(true);
  });

  it("reports conflict when CLAUDE.md already exists with different content", async () => {
    await writeFile(join(tempDir, "CLAUDE.md"), "# custom content");
    const result = await executeInit(tempDir, { ecosystem: "ts" }, false);
    expect(result.conflicts).toContain("CLAUDE.md");
  });

  it("merges into existing biome.json", async () => {
    await writeFile(
      join(tempDir, "biome.json"),
      JSON.stringify({ formatter: { indentWidth: 4 } })
    );
    await executeInit(tempDir, { ecosystem: "ts" }, false);
    const content = JSON.parse(
      await readFile(join(tempDir, "biome.json"), "utf-8")
    );
    expect(content.formatter.indentWidth).toBe(4);
    expect(content.linter.rules.suspicious.noConsole).toBe("error");
  });

  it("defaults to ts ecosystem when not specified", async () => {
    await executeInit(tempDir, {}, false);
    expect(await fileExists(join(tempDir, "biome.json"))).toBe(true);
  });
});
