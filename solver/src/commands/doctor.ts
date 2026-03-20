import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getAllSkillGenerators } from "../templates/skills/index.js";
import { fileExists } from "../utils/files.js";
import { error, heading, success, warn } from "../utils/output.js";

export interface DoctorReport {
  claudeMd: "ok" | "missing";
  settings: "ok" | "missing" | "invalid";
  hooks: "ok" | "missing";
  skills: "ok" | "missing" | "incomplete";
  biome: "ok" | "missing";
  biomeConfig: "ok" | "misconfigured" | "missing";
  openspec: "ok" | "missing";
  healthy: boolean;
}

export async function executeDoctor(
  projectRoot: string,
): Promise<DoctorReport> {
  heading("solver doctor");

  const report: DoctorReport = {
    biome: "missing",
    biomeConfig: "missing",
    claudeMd: "missing",
    healthy: false,
    hooks: "missing",
    openspec: "missing",
    settings: "missing",
    skills: "missing",
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
      error(
        ".claude/settings.json contains invalid JSON — delete and run `solver init`",
      );
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

  // 4. Check .claude/skills/ directory with skill files
  const expectedSkills = getAllSkillGenerators().map((g) => g.dirName);
  const skillsDir = join(projectRoot, ".claude", "skills");

  if (await fileExists(skillsDir)) {
    const skillChecks = await Promise.all(
      expectedSkills.map((skill) =>
        fileExists(join(skillsDir, skill, "SKILL.md")),
      ),
    );
    const presentCount = skillChecks.filter(Boolean).length;

    if (presentCount === expectedSkills.length) {
      report.skills = "ok";
      success(`.claude/skills/ has all ${expectedSkills.length} skill files`);
    } else if (presentCount > 0) {
      report.skills = "incomplete";
      const missingSkills = expectedSkills.filter((_, i) => !skillChecks[i]);
      warn(
        `.claude/skills/ is missing: ${missingSkills.join(", ")} — run \`solver init\` to create them`,
      );
    } else {
      warn(
        ".claude/skills/ directory exists but has no skill files — run `solver init` to create them",
      );
    }
  } else {
    warn(".claude/skills/ is missing — run `solver init` to create it");
  }

  // 5. Check biome.json
  const biomePath = join(projectRoot, "biome.json");
  if (await fileExists(biomePath)) {
    report.biome = "ok";
    success("biome.json exists");

    // 5b. Verify biome.json has noConsole rule set to "error"
    try {
      const biomeContent = await readFile(biomePath, "utf-8");
      const biomeConfig = JSON.parse(biomeContent);
      const noConsole = biomeConfig?.linter?.rules?.suspicious?.noConsole;
      if (noConsole === "error") {
        report.biomeConfig = "ok";
        success("biome.json noConsole rule is active");
      } else {
        report.biomeConfig = "misconfigured";
        warn('biome.json noConsole rule is missing or not set to "error"');
      }
    } catch {
      report.biomeConfig = "misconfigured";
      warn("biome.json could not be parsed for config verification");
    }
  } else {
    warn("biome.json is missing — run `solver init` to create it");
  }

  // 6. Check openspec/
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
    report.skills === "ok" &&
    report.biome === "ok" &&
    report.biomeConfig === "ok" &&
    report.openspec === "ok";

  heading(report.healthy ? "all checks passed" : "some checks failed");

  return report;
}
