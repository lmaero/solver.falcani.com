import { execFile } from "node:child_process";
import { chmod } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { generateClaudeMd } from "../templates/claude-md.js";
import { generateBiomeJson } from "../templates/ecosystem/typescript/biome-json.js";
import { generateLoggerModule } from "../templates/ecosystem/typescript/logger.js";
import { generateVitestConfig } from "../templates/ecosystem/typescript/vitest-config.js";
import { generatePostTestHook } from "../templates/hooks/post-test.js";
import { generatePostWriteHook } from "../templates/hooks/post-write.js";
import { generateSessionEndHook } from "../templates/hooks/session-end.js";
import { generateRecommendations } from "../templates/recommendations.js";
import { generateSettingsJson } from "../templates/settings-json.js";
import { getAllSkillGenerators } from "../templates/skills/index.js";
import type { Ecosystem, InitOptions } from "../types.js";
import { detectProjectState } from "../utils/detect.js";
import {
  ensureDir,
  mergeJsonFile,
  overwriteFile,
  writeFileIfNotExists,
} from "../utils/files.js";
import { confirm, heading, info, success, warn } from "../utils/output.js";

const execFileAsync = promisify(execFile);

interface InitResult {
  conflicts: string[];
  overwritten: string[];
  openspecSkipped: boolean;
}

async function writeOrPrompt(
  filePath: string,
  content: string,
  displayName: string,
  conflicts: string[],
  overwritten: string[],
  interactive: boolean,
): Promise<"created" | "skipped" | "overwritten" | "kept"> {
  const result = await writeFileIfNotExists(filePath, content);

  if (result.action === "created") {
    success(`Created ${displayName}`);
    return "created";
  }

  if (result.action === "skipped") {
    info(`${displayName} already up to date`);
    return "skipped";
  }

  // Conflict — file exists with different content
  if (interactive) {
    const shouldOverwrite = await confirm(
      `${displayName} already exists with different content. Overwrite with framework version?`,
    );
    if (shouldOverwrite) {
      await overwriteFile(filePath, content);
      success(`Overwritten ${displayName}`);
      overwritten.push(displayName);
      return "overwritten";
    }
    info(`Kept existing ${displayName}`);
    conflicts.push(displayName);
    return "kept";
  }

  warn(
    `${displayName} already exists with different content — keeping existing`,
  );
  conflicts.push(displayName);
  return "kept";
}

export async function executeInit(
  projectRoot: string,
  options: InitOptions,
  interactive = true,
): Promise<InitResult> {
  const ecosystem: Ecosystem = options.ecosystem ?? "ts";
  const conflicts: string[] = [];
  const overwritten: string[] = [];

  heading("solver init");
  info(`Ecosystem: ${ecosystem}`);

  const state = await detectProjectState(projectRoot);

  // 1. Create CLAUDE.md
  await writeOrPrompt(
    join(projectRoot, "CLAUDE.md"),
    generateClaudeMd(),
    "CLAUDE.md",
    conflicts,
    overwritten,
    interactive,
  );

  // 2. Create .claude/ directories
  await ensureDir(join(projectRoot, ".claude", "hooks"));
  await ensureDir(join(projectRoot, ".claude", "skills"));

  // 2b. Install pattern-based skills
  const skillGenerators = getAllSkillGenerators();
  for (const { dirName, generate } of skillGenerators) {
    const skillDir = join(projectRoot, ".claude", "skills", dirName);
    await ensureDir(skillDir);
    await writeOrPrompt(
      join(skillDir, "SKILL.md"),
      generate(),
      `.claude/skills/${dirName}/SKILL.md`,
      conflicts,
      overwritten,
      interactive,
    );
  }
  success(`Installed ${skillGenerators.length} pattern-based skills`);

  // 3. Create or merge .claude/settings.json
  await writeOrPrompt(
    join(projectRoot, ".claude", "settings.json"),
    generateSettingsJson(),
    ".claude/settings.json",
    conflicts,
    overwritten,
    interactive,
  );

  // 4. Create hook files
  const hooks: Array<{ name: string; content: string }> = [
    { name: "post-write.sh", content: generatePostWriteHook(ecosystem) },
    { name: "post-test.sh", content: generatePostTestHook(ecosystem) },
    { name: "session-end.sh", content: generateSessionEndHook(ecosystem) },
  ];

  for (const hook of hooks) {
    const hookPath = join(projectRoot, ".claude", "hooks", hook.name);
    const action = await writeOrPrompt(
      hookPath,
      hook.content,
      `.claude/hooks/${hook.name}`,
      conflicts,
      overwritten,
      interactive,
    );
    if (action === "created" || action === "overwritten") {
      await chmod(hookPath, 0o755);
    }
  }

  // 5. Ecosystem-specific files
  if (ecosystem === "ts") {
    await scaffoldTypeScriptEcosystem(
      projectRoot,
      state.hasBiomeJson,
      conflicts,
      overwritten,
      interactive,
    );
  }

  // 6. OpenSpec init
  const openspecSkipped = await initOpenSpec(projectRoot, state.hasOpenSpec);

  heading("solver init complete");
  if (overwritten.length > 0) {
    success(`${overwritten.length} file(s) overwritten with framework version`);
  }
  if (conflicts.length > 0) {
    warn(`${conflicts.length} file(s) kept with existing content`);
  }
  if (conflicts.length === 0 && overwritten.length === 0) {
    success("All files created successfully");
  }

  return { conflicts, overwritten, openspecSkipped };
}

async function scaffoldTypeScriptEcosystem(
  projectRoot: string,
  hasBiomeJson: boolean,
  conflicts: string[],
  overwritten: string[],
  interactive: boolean,
): Promise<void> {
  heading("TypeScript ecosystem");

  // biome.json — always merge (combines existing config with framework rules)
  if (hasBiomeJson) {
    await mergeJsonFile(join(projectRoot, "biome.json"), generateBiomeJson());
    success("Merged biome.json with solver defaults");
  } else {
    await writeOrPrompt(
      join(projectRoot, "biome.json"),
      JSON.stringify(generateBiomeJson(), null, 2),
      "biome.json",
      conflicts,
      overwritten,
      interactive,
    );
  }

  // vitest.config.ts
  await writeOrPrompt(
    join(projectRoot, "vitest.config.ts"),
    generateVitestConfig(),
    "vitest.config.ts",
    conflicts,
    overwritten,
    interactive,
  );

  // lib/logger.ts
  await ensureDir(join(projectRoot, "lib"));
  await writeOrPrompt(
    join(projectRoot, "lib", "logger.ts"),
    generateLoggerModule(),
    "lib/logger.ts",
    conflicts,
    overwritten,
    interactive,
  );

  // docs/solver-ts-recommendations.md
  await ensureDir(join(projectRoot, "docs"));
  await writeOrPrompt(
    join(projectRoot, "docs", "solver-ts-recommendations.md"),
    generateRecommendations(),
    "docs/solver-ts-recommendations.md",
    conflicts,
    overwritten,
    interactive,
  );
}

async function initOpenSpec(
  projectRoot: string,
  hasOpenSpec: boolean,
): Promise<boolean> {
  if (hasOpenSpec) {
    info("openspec/ already exists — skipping OpenSpec init");
    return true;
  }

  try {
    info("Running OpenSpec init...");
    await execFileAsync("npx", ["@fission-ai/openspec@latest", "init"], {
      cwd: projectRoot,
      timeout: 30_000,
    });
    success("OpenSpec initialized");
    return false;
  } catch {
    warn(
      "OpenSpec init failed — you can run it manually: npx @fission-ai/openspec@latest init",
    );
    return false;
  }
}
