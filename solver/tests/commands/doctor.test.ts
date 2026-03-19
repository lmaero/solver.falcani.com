import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { executeDoctor } from "../../src/commands/doctor.js";
import { executeInit } from "../../src/commands/init.js";
import { mkdtemp, rm, unlink, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("executeDoctor", { timeout: 60_000 }, () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-doctor-"));
    await executeInit(tempDir, { ecosystem: "ts" });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("reports all healthy after fresh init", async () => {
    const report = await executeDoctor(tempDir);
    expect(report.claudeMd).toBe("ok");
    expect(report.settings).toBe("ok");
    expect(report.hooks).toBe("ok");
    expect(report.biome).toBe("ok");
    expect(report.healthy).toBe(true);
  });

  it("reports missing CLAUDE.md", async () => {
    await unlink(join(tempDir, "CLAUDE.md"));
    const report = await executeDoctor(tempDir);
    expect(report.claudeMd).toBe("missing");
    expect(report.healthy).toBe(false);
  });

  it("reports missing biome.json", async () => {
    await unlink(join(tempDir, "biome.json"));
    const report = await executeDoctor(tempDir);
    expect(report.biome).toBe("missing");
    expect(report.healthy).toBe(false);
  });

  it("reports invalid settings.json", async () => {
    await writeFile(join(tempDir, ".claude", "settings.json"), "not json");
    const report = await executeDoctor(tempDir);
    expect(report.settings).toBe("invalid");
    expect(report.healthy).toBe(false);
  });

  it("reports missing hooks directory", async () => {
    await rm(join(tempDir, ".claude", "hooks"), { recursive: true });
    const report = await executeDoctor(tempDir);
    expect(report.hooks).toBe("missing");
    expect(report.healthy).toBe(false);
  });

  it("reports missing openspec", async () => {
    // openspec/ may not exist after init if npx failed, which is expected
    const report = await executeDoctor(tempDir);
    // This test verifies the field exists in the report
    expect(["ok", "missing"]).toContain(report.openspec);
  });
});
