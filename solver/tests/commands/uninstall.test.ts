import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { executeUninstall } from "../../src/commands/uninstall.js";
import { executeInit } from "../../src/commands/init.js";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileExists } from "../../src/utils/files.js";

describe("executeUninstall", { timeout: 60_000 }, () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-uninstall-"));
    await executeInit(tempDir, { ecosystem: "ts" });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("removes CLAUDE.md", async () => {
    await executeUninstall(tempDir);
    expect(await fileExists(join(tempDir, "CLAUDE.md"))).toBe(false);
  });

  it("removes .claude/hooks", async () => {
    await executeUninstall(tempDir);
    expect(await fileExists(join(tempDir, ".claude", "hooks"))).toBe(false);
  });

  it("removes .claude/skills", async () => {
    await executeUninstall(tempDir);
    expect(await fileExists(join(tempDir, ".claude", "skills"))).toBe(false);
  });

  it("removes .claude/settings.json", async () => {
    await executeUninstall(tempDir);
    expect(await fileExists(join(tempDir, ".claude", "settings.json"))).toBe(false);
  });

  it("keeps project source code untouched", async () => {
    await writeFile(join(tempDir, "src.ts"), "const x = 1;");
    await executeUninstall(tempDir);
    expect(await fileExists(join(tempDir, "src.ts"))).toBe(true);
  });

  it("keeps biome.json", async () => {
    await executeUninstall(tempDir);
    expect(await fileExists(join(tempDir, "biome.json"))).toBe(true);
  });

  it("keeps openspec/ directory", async () => {
    await mkdir(join(tempDir, "openspec"), { recursive: true });
    await writeFile(join(tempDir, "openspec", "config.yaml"), "test");
    await executeUninstall(tempDir);
    expect(await fileExists(join(tempDir, "openspec", "config.yaml"))).toBe(true);
  });
});
