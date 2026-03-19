import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../utils/files.js";
import { success, warn, error, heading } from "../utils/output.js";

export interface DoctorReport {
  claudeMd: "ok" | "missing";
  settings: "ok" | "missing" | "invalid";
  hooks: "ok" | "missing";
  biome: "ok" | "missing";
  openspec: "ok" | "missing";
  healthy: boolean;
}

export async function executeDoctor(projectRoot: string): Promise<DoctorReport> {
  heading("solver doctor");

  const report: DoctorReport = {
    claudeMd: "missing",
    settings: "missing",
    hooks: "missing",
    biome: "missing",
    openspec: "missing",
    healthy: false,
  };

  // 1. Check CLAUDE.md
  if (await fileExists(join(projectRoot, "CLAUDE.md"))) {
    report.claudeMd = "ok";
    success("CLAUDE.md exists");
  } else {
    warn("CLAUDE.md is missing — run `solver init` to create it");
  }

  // 2. Check .claude/settings.json
  const settingsPath = join(projectRoot, ".claude", "settings.json");
  if (await fileExists(settingsPath)) {
    try {
      const content = await readFile(settingsPath, "utf-8");
      JSON.parse(content);
      report.settings = "ok";
      success(".claude/settings.json is valid");
    } catch {
      report.settings = "invalid";
      error(".claude/settings.json contains invalid JSON — delete and run `solver init`");
    }
  } else {
    warn(".claude/settings.json is missing — run `solver init` to create it");
  }

  // 3. Check .claude/hooks/ directory with hook scripts
  const hooksDir = join(projectRoot, ".claude", "hooks");
  const hookFiles = ["post-write.sh", "post-test.sh", "session-end.sh"];
  const hookChecks = await Promise.all(
    hookFiles.map((hook) => fileExists(join(hooksDir, hook))),
  );
  const allHooksPresent = hookChecks.every(Boolean);

  if (allHooksPresent) {
    report.hooks = "ok";
    success(".claude/hooks/ has all hook scripts");
  } else {
    const missingHooks = hookFiles.filter((_, i) => !hookChecks[i]);
    warn(
      `.claude/hooks/ is missing: ${missingHooks.join(", ")} — run \`solver init\` to create them`,
    );
  }

  // 4. Check biome.json
  if (await fileExists(join(projectRoot, "biome.json"))) {
    report.biome = "ok";
    success("biome.json exists");
  } else {
    warn("biome.json is missing — run `solver init` to create it");
  }

  // 5. Check openspec/
  if (await fileExists(join(projectRoot, "openspec"))) {
    report.openspec = "ok";
    success("openspec/ directory exists");
  } else {
    warn("openspec/ is missing — run `npx @fission-ai/openspec@latest init`");
  }

  // Determine overall health
  report.healthy =
    report.claudeMd === "ok" &&
    report.settings === "ok" &&
    report.hooks === "ok" &&
    report.biome === "ok" &&
    report.openspec === "ok";

  heading(report.healthy ? "all checks passed" : "some checks failed");

  return report;
}
