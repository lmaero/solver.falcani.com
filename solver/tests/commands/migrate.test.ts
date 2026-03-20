import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { executeMigrate } from "../../src/commands/migrate.js";
import { fileExists } from "../../src/utils/files.js";

describe("executeMigrate", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-migrate-"));
  });

  afterEach(async () => {
    await rm(tempDir, {
      recursive: true,
    });
  });

  it("creates a migration assessment file", async () => {
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: {
          express: "^4.0.0",
        },
      }),
    );
    const result = await executeMigrate(tempDir);
    expect(await fileExists(result.reportPath)).toBe(true);
  });

  it("contains current stack", async () => {
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: {
          express: "^4.0.0",
          mongoose: "^8.0.0",
        },
      }),
    );
    const result = await executeMigrate(tempDir);
    const content = await readFile(result.reportPath, "utf-8");
    expect(content).toContain("express");
    expect(content).toContain("mongoose");
  });

  it("contains migration sections", async () => {
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: {
          react: "^19.0.0",
        },
      }),
    );
    const result = await executeMigrate(tempDir);
    const content = await readFile(result.reportPath, "utf-8");
    expect(content).toContain("Migration Assessment");
    expect(content).toContain("normalize");
    expect(content).toContain("debt");
  });
});
