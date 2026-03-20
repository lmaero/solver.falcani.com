import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { executeInit } from "../../src/commands/init.js";

describe("skills integration", { timeout: 60_000 }, () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-skills-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("solver init creates 8 skill directories", async () => {
    await executeInit(tempDir, { ecosystem: "ts" }, false);
    const skillDirs = await readdir(join(tempDir, ".claude", "skills"));
    // Filter out any openspec-related entries that may exist
    const solverSkills = skillDirs.filter((d) => !d.startsWith("openspec"));
    expect(solverSkills).toHaveLength(8);
  });

  it("each skill directory contains a SKILL.md file", async () => {
    await executeInit(tempDir, { ecosystem: "ts" }, false);
    const expectedSkills = [
      "action-patterns",
      "data-access-patterns",
      "env-validation",
      "logging",
      "ci-cd-patterns",
      "discovery",
      "domain-patterns",
      "testing-strategy",
    ];
    for (const skill of expectedSkills) {
      const skillFile = join(tempDir, ".claude", "skills", skill, "SKILL.md");
      const content = await readFile(skillFile, "utf-8");
      expect(content).toContain("---");
      expect(content.length).toBeGreaterThan(500);
    }
  });

  it("skill files have correct YAML frontmatter", async () => {
    await executeInit(tempDir, { ecosystem: "ts" }, false);
    const skillFile = join(
      tempDir,
      ".claude",
      "skills",
      "action-patterns",
      "SKILL.md",
    );
    const content = await readFile(skillFile, "utf-8");
    expect(content).toMatch(/^---\n/);
    expect(content).toContain("name: action-patterns");
    expect(content).toContain("description:");
  });

  it("running init twice does not create conflicts for skills", async () => {
    await executeInit(tempDir, { ecosystem: "ts" }, false);
    const secondRun = await executeInit(tempDir, { ecosystem: "ts" }, false);
    // Skills should be idempotent — no conflicts on second run
    expect(secondRun.conflicts).toHaveLength(0);
  });
});
