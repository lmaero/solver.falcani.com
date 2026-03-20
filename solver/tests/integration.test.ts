import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { executeInit } from "../src/commands/init.js";
import { executeDoctor } from "../src/commands/doctor.js";
import { executeUninstall } from "../src/commands/uninstall.js";
import { compareFrameworkFiles } from "../src/commands/update.js";
import { mkdtemp, rm, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileExists } from "../src/utils/files.js";

describe("full lifecycle: init -> doctor -> update -> uninstall", { timeout: 120_000 }, () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-integration-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("completes full lifecycle without errors", async () => {
    // --- Init ---
    const initResult = await executeInit(tempDir, { ecosystem: "ts" });
    expect(initResult.conflicts).toHaveLength(0);

    // Verify CLAUDE.md content is framework-agnostic
    const claudeMd = await readFile(join(tempDir, "CLAUDE.md"), "utf-8");
    expect(claudeMd).toContain("solver");
    expect(claudeMd).toContain("OpenSpec");
    expect(claudeMd).not.toContain("shadcn");
    expect(claudeMd).not.toContain("Tailwind");

    // Verify ecosystem files were created
    expect(await fileExists(join(tempDir, "biome.json"))).toBe(true);
    expect(await fileExists(join(tempDir, "vitest.config.ts"))).toBe(true);
    expect(await fileExists(join(tempDir, "lib", "logger.ts"))).toBe(true);

    // Verify hooks were created
    expect(await fileExists(join(tempDir, ".claude", "hooks", "post-write.sh"))).toBe(true);
    expect(await fileExists(join(tempDir, ".claude", "hooks", "post-test.sh"))).toBe(true);
    expect(await fileExists(join(tempDir, ".claude", "hooks", "session-end.sh"))).toBe(true);

    // Verify skills were created
    expect(await fileExists(join(tempDir, ".claude", "skills", "action-patterns", "SKILL.md"))).toBe(true);
    expect(await fileExists(join(tempDir, ".claude", "skills", "logging", "SKILL.md"))).toBe(true);

    // --- Doctor ---
    // OpenSpec may or may not have initialized via npx, so ensure it exists
    // for a deterministic doctor check
    await mkdir(join(tempDir, "openspec"), { recursive: true });

    const doctorReport = await executeDoctor(tempDir);
    expect(doctorReport.claudeMd).toBe("ok");
    expect(doctorReport.settings).toBe("ok");
    expect(doctorReport.hooks).toBe("ok");
    expect(doctorReport.skills).toBe("ok");
    expect(doctorReport.biome).toBe("ok");
    expect(doctorReport.openspec).toBe("ok");
    expect(doctorReport.healthy).toBe(true);

    // --- Update: no changes after fresh init ---
    const diffs = await compareFrameworkFiles(tempDir, "ts");
    const changes = diffs.filter((d) => d.status !== "up-to-date");
    expect(changes).toHaveLength(0);

    // --- Uninstall ---
    const uninstallResult = await executeUninstall(tempDir);
    expect(uninstallResult.removed.length).toBeGreaterThan(0);

    // Framework files are gone
    expect(await fileExists(join(tempDir, "CLAUDE.md"))).toBe(false);
    expect(await fileExists(join(tempDir, ".claude", "hooks"))).toBe(false);
    expect(await fileExists(join(tempDir, ".claude", "skills"))).toBe(false);
    expect(await fileExists(join(tempDir, ".claude", "settings.json"))).toBe(false);

    // Ecosystem files are preserved (uninstall only removes framework files)
    expect(await fileExists(join(tempDir, "biome.json"))).toBe(true);
    expect(await fileExists(join(tempDir, "vitest.config.ts"))).toBe(true);
    expect(await fileExists(join(tempDir, "lib", "logger.ts"))).toBe(true);
  });

  it("init is idempotent — running twice produces no conflicts", async () => {
    await executeInit(tempDir, { ecosystem: "ts" });
    const secondRun = await executeInit(tempDir, { ecosystem: "ts" });
    expect(secondRun.conflicts).toHaveLength(0);
  });

  it("doctor detects missing files after uninstall", async () => {
    await executeInit(tempDir, { ecosystem: "ts" });
    await executeUninstall(tempDir);

    const report = await executeDoctor(tempDir);
    expect(report.claudeMd).toBe("missing");
    expect(report.settings).toBe("missing");
    expect(report.hooks).toBe("missing");
    expect(report.healthy).toBe(false);
  });

  it("update detects missing files after uninstall", async () => {
    await executeInit(tempDir, { ecosystem: "ts" });
    await executeUninstall(tempDir);

    const diffs = await compareFrameworkFiles(tempDir, "ts");
    const missing = diffs.filter((d) => d.status === "missing");
    expect(missing.length).toBeGreaterThan(0);
  });
});
