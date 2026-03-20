import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { executeInit } from "../src/commands/init.js";
import { executeDoctor } from "../src/commands/doctor.js";
import { executeUninstall } from "../src/commands/uninstall.js";
import { compareFrameworkFiles } from "../src/commands/update.js";
import { executeScan } from "../src/commands/scan.js";
import { executeAudit } from "../src/commands/audit.js";
import { executeReport } from "../src/commands/report.js";
import { executeMigrate } from "../src/commands/migrate.js";
import { mkdtemp, rm, readFile, mkdir, writeFile } from "node:fs/promises";
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
    const initResult = await executeInit(tempDir, { ecosystem: "ts" }, false);
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
    await executeInit(tempDir, { ecosystem: "ts" }, false);
    const secondRun = await executeInit(tempDir, { ecosystem: "ts" }, false);
    expect(secondRun.conflicts).toHaveLength(0);
  });

  it("doctor detects missing files after uninstall", async () => {
    await executeInit(tempDir, { ecosystem: "ts" }, false);
    await executeUninstall(tempDir);

    const report = await executeDoctor(tempDir);
    expect(report.claudeMd).toBe("missing");
    expect(report.settings).toBe("missing");
    expect(report.hooks).toBe("missing");
    expect(report.healthy).toBe(false);
  });

  it("update detects missing files after uninstall", async () => {
    await executeInit(tempDir, { ecosystem: "ts" }, false);
    await executeUninstall(tempDir);

    const diffs = await compareFrameworkFiles(tempDir, "ts");
    const missing = diffs.filter((d) => d.status === "missing");
    expect(missing.length).toBeGreaterThan(0);
  });

  it("solver scan produces a report with architecture placeholder", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "const x = 1;");
    const scanResult = await executeScan(tempDir);
    expect(scanResult.reportPath).toContain("solver-scan");
    const content = await readFile(scanResult.reportPath, "utf-8");
    expect(content).toContain("Architecture Overview");
  });

  it("solver audit produces a scorecard", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    const auditResult = await executeAudit(tempDir);
    expect(auditResult.scorecard).toBeDefined();
    expect(auditResult.consoleViolations).toBe(0);
  });

  it("solver report produces a field report", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    const reportResult = await executeReport(tempDir);
    expect(reportResult.reportPath).toContain("solver-report");
  });

  it("solver migrate produces a migration assessment", async () => {
    await writeFile(join(tempDir, "package.json"), JSON.stringify({
      dependencies: { react: "^19.0.0" }
    }));
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "const x = 1;");
    const migrateResult = await executeMigrate(tempDir);
    expect(migrateResult.reportPath).toContain("solver-migrate");
  });
});
