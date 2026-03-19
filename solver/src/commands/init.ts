import { chmod } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Ecosystem, InitOptions } from "../types.js";
import { detectProjectState } from "../utils/detect.js";
import {
  writeFileIfNotExists,
  mergeJsonFile,
  ensureDir,
} from "../utils/files.js";
import { success, warn, info, heading } from "../utils/output.js";
import { generateClaudeMd } from "../templates/claude-md.js";
import { generateSettingsJson } from "../templates/settings-json.js";
import { generatePostWriteHook } from "../templates/hooks/post-write.js";
import { generatePostTestHook } from "../templates/hooks/post-test.js";
import { generateSessionEndHook } from "../templates/hooks/session-end.js";
import { generateBiomeJson } from "../templates/ecosystem/typescript/biome-json.js";
import { generateVitestConfig } from "../templates/ecosystem/typescript/vitest-config.js";
import { generateLoggerModule } from "../templates/ecosystem/typescript/logger.js";
import { generateRecommendations } from "../templates/recommendations.js";

const execFileAsync = promisify(execFile);

interface InitResult {
  conflicts: string[];
  openspecSkipped: boolean;
}

export async function executeInit(
  projectRoot: string,
  options: InitOptions,
): Promise<InitResult> {
  const ecosystem: Ecosystem = options.ecosystem ?? "ts";
  const conflicts: string[] = [];

  heading("solver init");
  info(`Ecosystem: ${ecosystem}`);

  const state = await detectProjectState(projectRoot);

  // 1. Create CLAUDE.md
  const claudeMdResult = await writeFileIfNotExists(
    join(projectRoot, "CLAUDE.md"),
    generateClaudeMd(),
  );
  if (claudeMdResult.action === "created") {
    success("Created CLAUDE.md");
  } else if (claudeMdResult.action === "conflict") {
    warn("CLAUDE.md already exists with different content — keeping existing");
    conflicts.push("CLAUDE.md");
  } else {
    info("CLAUDE.md already up to date");
  }

  // 2. Create .claude/ directories
  await ensureDir(join(projectRoot, ".claude", "hooks"));
  await ensureDir(join(projectRoot, ".claude", "skills"));

  // 3. Create or merge .claude/settings.json
  const settingsResult = await writeFileIfNotExists(
    join(projectRoot, ".claude", "settings.json"),
    generateSettingsJson(),
  );
  if (settingsResult.action === "created") {
    success("Created .claude/settings.json");
  } else if (settingsResult.action === "conflict") {
    warn(
      ".claude/settings.json already exists with different content — keeping existing",
    );
    conflicts.push(".claude/settings.json");
  } else {
    info(".claude/settings.json already up to date");
  }

  // 4. Create hook files
  const hooks: Array<{ name: string; content: string }> = [
    { name: "post-write.sh", content: generatePostWriteHook(ecosystem) },
    { name: "post-test.sh", content: generatePostTestHook(ecosystem) },
    { name: "session-end.sh", content: generateSessionEndHook(ecosystem) },
  ];

  for (const hook of hooks) {
    const hookPath = join(projectRoot, ".claude", "hooks", hook.name);
    const hookResult = await writeFileIfNotExists(hookPath, hook.content);
    if (hookResult.action === "created") {
      await chmod(hookPath, 0o755);
      success(`Created .claude/hooks/${hook.name}`);
    } else if (hookResult.action === "conflict") {
      warn(
        `.claude/hooks/${hook.name} already exists with different content — keeping existing`,
      );
      conflicts.push(`.claude/hooks/${hook.name}`);
    } else {
      info(`.claude/hooks/${hook.name} already up to date`);
    }
  }

  // 5. Ecosystem-specific files
  if (ecosystem === "ts") {
    await scaffoldTypeScriptEcosystem(projectRoot, state.hasBiomeJson, conflicts);
  }

  // 6. OpenSpec init
  const openspecSkipped = await initOpenSpec(projectRoot, state.hasOpenSpec);

  heading("solver init complete");
  if (conflicts.length > 0) {
    warn(`${conflicts.length} conflict(s) — review files above`);
  } else {
    success("All files created successfully");
  }

  return { conflicts, openspecSkipped };
}

async function scaffoldTypeScriptEcosystem(
  projectRoot: string,
  hasBiomeJson: boolean,
  conflicts: string[],
): Promise<void> {
  heading("TypeScript ecosystem");

  // biome.json — merge if exists, create if not
  if (hasBiomeJson) {
    await mergeJsonFile(join(projectRoot, "biome.json"), generateBiomeJson());
    success("Merged biome.json with solver defaults");
  } else {
    const biomeResult = await writeFileIfNotExists(
      join(projectRoot, "biome.json"),
      JSON.stringify(generateBiomeJson(), null, 2),
    );
    if (biomeResult.action === "created") {
      success("Created biome.json");
    } else if (biomeResult.action === "conflict") {
      // This branch shouldn't be reached since we checked hasBiomeJson,
      // but handle it defensively
      warn("biome.json already exists with different content — keeping existing");
      conflicts.push("biome.json");
    }
  }

  // vitest.config.ts
  const vitestResult = await writeFileIfNotExists(
    join(projectRoot, "vitest.config.ts"),
    generateVitestConfig(),
  );
  if (vitestResult.action === "created") {
    success("Created vitest.config.ts");
  } else if (vitestResult.action === "conflict") {
    warn("vitest.config.ts already exists with different content — keeping existing");
    conflicts.push("vitest.config.ts");
  } else {
    info("vitest.config.ts already up to date");
  }

  // lib/logger.ts
  const loggerResult = await writeFileIfNotExists(
    join(projectRoot, "lib", "logger.ts"),
    generateLoggerModule(),
  );
  if (loggerResult.action === "created") {
    success("Created lib/logger.ts");
  } else if (loggerResult.action === "conflict") {
    warn("lib/logger.ts already exists with different content — keeping existing");
    conflicts.push("lib/logger.ts");
  } else {
    info("lib/logger.ts already up to date");
  }

  // docs/solver-ts-recommendations.md
  const recsResult = await writeFileIfNotExists(
    join(projectRoot, "docs", "solver-ts-recommendations.md"),
    generateRecommendations(),
  );
  if (recsResult.action === "created") {
    success("Created docs/solver-ts-recommendations.md");
  } else if (recsResult.action === "conflict") {
    warn(
      "docs/solver-ts-recommendations.md already exists with different content — keeping existing",
    );
    conflicts.push("docs/solver-ts-recommendations.md");
  } else {
    info("docs/solver-ts-recommendations.md already up to date");
  }
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
    warn("OpenSpec init failed — you can run it manually: npx @fission-ai/openspec@latest init");
    return false;
  }
}
