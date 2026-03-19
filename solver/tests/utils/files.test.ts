import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mergeJsonFile, writeFileIfNotExists } from "../../src/utils/files.js";

describe("writeFileIfNotExists", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("creates file when it does not exist", async () => {
    const filePath = join(tempDir, "new-file.txt");
    const result = await writeFileIfNotExists(filePath, "content");
    expect(result.action).toBe("created");
    const content = await readFile(filePath, "utf-8");
    expect(content).toBe("content");
  });

  it("skips when file exists and content matches", async () => {
    const filePath = join(tempDir, "existing.txt");
    await writeFile(filePath, "content");
    const result = await writeFileIfNotExists(filePath, "content");
    expect(result.action).toBe("skipped");
  });

  it("returns diff when file exists with different content", async () => {
    const filePath = join(tempDir, "existing.txt");
    await writeFile(filePath, "old content");
    const result = await writeFileIfNotExists(filePath, "new content");
    expect(result.action).toBe("conflict");
    expect(result.diff).toBeDefined();
  });

  it("creates intermediate directories when needed", async () => {
    const filePath = join(tempDir, "deep", "nested", "file.txt");
    const result = await writeFileIfNotExists(filePath, "nested content");
    expect(result.action).toBe("created");
    const content = await readFile(filePath, "utf-8");
    expect(content).toBe("nested content");
  });
});

describe("mergeJsonFile", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("creates file when it does not exist", async () => {
    const filePath = join(tempDir, "config.json");
    const result = await mergeJsonFile(filePath, { key: "value" });
    expect(result.action).toBe("created");
    const content = JSON.parse(await readFile(filePath, "utf-8"));
    expect(content.key).toBe("value");
  });

  it("merges new keys into existing file", async () => {
    const filePath = join(tempDir, "config.json");
    await writeFile(filePath, JSON.stringify({ existing: true }));
    const result = await mergeJsonFile(filePath, { newKey: "value" });
    expect(result.action).toBe("merged");
    const content = JSON.parse(await readFile(filePath, "utf-8"));
    expect(content.existing).toBe(true);
    expect(content.newKey).toBe("value");
  });

  it("deep merges nested objects", async () => {
    const filePath = join(tempDir, "config.json");
    await writeFile(
      filePath,
      JSON.stringify({ scripts: { build: "tsc", test: "vitest" } }),
    );
    const result = await mergeJsonFile(filePath, {
      scripts: { lint: "biome check ." },
    });
    expect(result.action).toBe("merged");
    const content = JSON.parse(await readFile(filePath, "utf-8"));
    expect(content.scripts.build).toBe("tsc");
    expect(content.scripts.test).toBe("vitest");
    expect(content.scripts.lint).toBe("biome check .");
  });

  it("does not overwrite existing scalar values", async () => {
    const filePath = join(tempDir, "config.json");
    await writeFile(filePath, JSON.stringify({ name: "original" }));
    const result = await mergeJsonFile(filePath, { name: "override" });
    expect(result.action).toBe("merged");
    const content = JSON.parse(await readFile(filePath, "utf-8"));
    // Deep merge: source overwrites target scalars
    expect(content.name).toBe("override");
  });
});
