import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectProjectState } from "../../src/utils/detect.js";

describe("detectProjectState", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("detects empty project", async () => {
    const state = await detectProjectState(tempDir);
    expect(state.hasClaudeMd).toBe(false);
    expect(state.hasClaudeDir).toBe(false);
    expect(state.hasOpenSpec).toBe(false);
    expect(state.hasBiomeJson).toBe(false);
    expect(state.hasPackageJson).toBe(false);
  });

  it("detects existing CLAUDE.md", async () => {
    await writeFile(join(tempDir, "CLAUDE.md"), "# existing");
    const state = await detectProjectState(tempDir);
    expect(state.hasClaudeMd).toBe(true);
  });

  it("detects existing openspec directory", async () => {
    await mkdir(join(tempDir, "openspec"));
    const state = await detectProjectState(tempDir);
    expect(state.hasOpenSpec).toBe(true);
  });

  it("detects existing .claude directory", async () => {
    await mkdir(join(tempDir, ".claude"));
    const state = await detectProjectState(tempDir);
    expect(state.hasClaudeDir).toBe(true);
  });

  it("detects existing package.json", async () => {
    await writeFile(join(tempDir, "package.json"), "{}");
    const state = await detectProjectState(tempDir);
    expect(state.hasPackageJson).toBe(true);
  });

  it("detects existing biome.json", async () => {
    await writeFile(join(tempDir, "biome.json"), "{}");
    const state = await detectProjectState(tempDir);
    expect(state.hasBiomeJson).toBe(true);
  });

  it("preserves projectRoot in returned state", async () => {
    const state = await detectProjectState(tempDir);
    expect(state.projectRoot).toBe(tempDir);
  });
});
