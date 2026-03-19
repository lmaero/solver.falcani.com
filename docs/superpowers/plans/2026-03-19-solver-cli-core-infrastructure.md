# Solver CLI + Core Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `@falcani/solver` CLI tool with init, doctor, update, and uninstall commands, plus generate all core framework files (CLAUDE.md, hooks, settings, OpenSpec integration).

**Architecture:** Node.js CLI published to npm as `@falcani/solver`. Each command is an independent module under `src/commands/`. Template files for CLAUDE.md, hooks, settings, and biome.json live in `src/templates/`. The CLI uses no heavy frameworks — just `commander` for argument parsing and `chalk` for output formatting. OpenSpec is a peer dependency invoked via its CLI.

**Tech Stack:** Node.js 20+, TypeScript, Commander.js, Chalk, Vitest for testing, Biome for linting, pnpm

**Spec:** `docs/superpowers/specs/2026-03-19-solver-framework-v2-design.md`

**Plan scope:** This is Plan 1 of 3. It covers the CLI skeleton, template files, and 4 commands (init, doctor, update, uninstall). Plan 2 covers the 8 pattern-based skills. Plan 3 covers the analysis commands (scan, audit, report, migrate).

---

## File Structure

```
solver/                              # New repo: @falcani/solver
├── package.json                     # CLI package config, bin entry
├── tsconfig.json                    # TypeScript strict config
├── biome.json                       # Linter config for the CLI itself
├── vitest.config.ts                 # Test config
├── src/
│   ├── index.ts                     # CLI entry point, commander setup
│   ├── commands/
│   │   ├── init.ts                  # solver init [--ecosystem ts|cpp]
│   │   ├── doctor.ts                # solver doctor
│   │   ├── update.ts                # solver update
│   │   └── uninstall.ts             # solver uninstall
│   ├── templates/
│   │   ├── claude-md.ts             # CLAUDE.md content generator
│   │   ├── settings-json.ts         # .claude/settings.json generator
│   │   ├── hooks/
│   │   │   ├── post-write.ts        # Biome lint + 400-line file size warning
│   │   │   ├── post-test.ts         # Run new test files after creation
│   │   │   └── session-end.ts       # Type check on session end template
│   │   ├── recommendations.ts       # TS ecosystem library recommendations file
│   │   └── ecosystem/
│   │       └── typescript/
│   │           ├── biome-json.ts    # biome.json with noConsole: error
│   │           ├── vitest-config.ts # vitest.config.ts template
│   │           └── logger.ts        # lib/logger.ts Pino setup template
│   ├── utils/
│   │   ├── files.ts                 # File read/write/diff/merge helpers
│   │   ├── output.ts                # Chalk-based output formatting
│   │   └── detect.ts                # Detect existing project state
│   └── types.ts                     # Shared type definitions
├── tests/
│   ├── commands/
│   │   ├── init.test.ts
│   │   ├── doctor.test.ts
│   │   ├── update.test.ts
│   │   └── uninstall.test.ts
│   ├── templates/
│   │   ├── claude-md.test.ts
│   │   └── settings-json.test.ts
│   └── utils/
│       ├── files.test.ts
│       └── detect.test.ts
└── README.md                        # CLI usage docs
```

---

### Task 1: Initialize the CLI project

**Files:**
- Create: `solver/package.json`
- Create: `solver/tsconfig.json`
- Create: `solver/biome.json`
- Create: `solver/vitest.config.ts`
- Create: `solver/src/index.ts`
- Create: `solver/src/types.ts`

- [ ] **Step 1: Create project directory and initialize**

```bash
mkdir solver && cd solver
pnpm init
```

- [ ] **Step 2: Install dependencies**

```bash
pnpm add commander chalk
pnpm add -D typescript @types/node vitest @biomejs/biome
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Create biome.json**

```json
{
  "$schema": "https://biomejs.dev/schemas/latest/schema.json",
  "linter": {
    "enabled": true,
    "rules": {
      "suspicious": {
        "noConsole": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  }
}
```

- [ ] **Step 5: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

- [ ] **Step 6: Create src/types.ts**

```typescript
export type Ecosystem = "ts" | "cpp";

export interface InitOptions {
  ecosystem?: Ecosystem;
}

export interface ProjectState {
  hasClaudeMd: boolean;
  hasClaudeDir: boolean;
  hasOpenSpec: boolean;
  hasBiomeJson: boolean;
  hasPackageJson: boolean;
  projectRoot: string;
}

export interface FileOperation {
  path: string;
  action: "create" | "merge" | "skip" | "diff-and-ask";
  content: string;
  reason?: string;
}
```

- [ ] **Step 7: Create src/index.ts with commander setup**

```typescript
#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("solver")
  .description("falcani solver framework — pattern authority for AI-assisted development")
  .version("0.1.0");

program.parse();
```

- [ ] **Step 8: Configure package.json bin entry and scripts**

Update `package.json` to add:
```json
{
  "type": "module",
  "bin": {
    "solver": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "test:run": "vitest run",
    "lint": "biome check .",
    "lint:fix": "biome check --write ."
  }
}
```

- [ ] **Step 9: Build and verify CLI runs**

```bash
pnpm build && node dist/index.js --help
```
Expected: help output showing "solver" with description and version.

- [ ] **Step 10: Commit**

```bash
git add solver/
git commit -m "feat: initialize solver CLI project skeleton"
```

---

### Task 2: Build utility modules (files, output, detect)

**Files:**
- Create: `solver/src/utils/files.ts`
- Create: `solver/src/utils/output.ts`
- Create: `solver/src/utils/detect.ts`
- Create: `solver/tests/utils/files.test.ts`
- Create: `solver/tests/utils/detect.test.ts`

- [ ] **Step 1: Write failing tests for file utilities**

```typescript
// tests/utils/files.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileIfNotExists, mergeJsonFile } from "../../src/utils/files.js";
import { mkdtemp, rm, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

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
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd solver && pnpm test:run tests/utils/files.test.ts
```
Expected: FAIL — modules not found

- [ ] **Step 3: Implement file utilities**

```typescript
// src/utils/files.ts
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname } from "node:path";

interface FileResult {
  action: "created" | "skipped" | "conflict" | "merged";
  diff?: string;
}

export async function writeFileIfNotExists(
  filePath: string,
  content: string
): Promise<FileResult> {
  try {
    const existing = await readFile(filePath, "utf-8");
    if (existing === content) {
      return { action: "skipped" };
    }
    return {
      action: "conflict",
      diff: `Existing file differs. Current: ${existing.length} chars, New: ${content.length} chars`,
    };
  } catch {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content);
    return { action: "created" };
  }
}

export async function mergeJsonFile(
  filePath: string,
  newData: Record<string, unknown>
): Promise<FileResult> {
  try {
    const existing = JSON.parse(await readFile(filePath, "utf-8"));
    const merged = deepMerge(existing, newData);
    await writeFile(filePath, JSON.stringify(merged, null, 2));
    return { action: "merged" };
  } catch {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(newData, null, 2));
    return { action: "created" };
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === "object" &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof target[key] === "object" &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      );
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd solver && pnpm test:run tests/utils/files.test.ts
```
Expected: PASS

- [ ] **Step 5: Write failing tests for project state detection**

```typescript
// tests/utils/detect.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { detectProjectState } from "../../src/utils/detect.js";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

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
});
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
cd solver && pnpm test:run tests/utils/detect.test.ts
```
Expected: FAIL

- [ ] **Step 7: Implement detect utility**

```typescript
// src/utils/detect.ts
import type { ProjectState } from "../types.js";
import { fileExists } from "./files.js";
import { join } from "node:path";

export async function detectProjectState(
  projectRoot: string
): Promise<ProjectState> {
  const [hasClaudeMd, hasClaudeDir, hasOpenSpec, hasBiomeJson, hasPackageJson] =
    await Promise.all([
      fileExists(join(projectRoot, "CLAUDE.md")),
      fileExists(join(projectRoot, ".claude")),
      fileExists(join(projectRoot, "openspec")),
      fileExists(join(projectRoot, "biome.json")),
      fileExists(join(projectRoot, "package.json")),
    ]);

  return {
    hasClaudeMd,
    hasClaudeDir,
    hasOpenSpec,
    hasBiomeJson,
    hasPackageJson,
    projectRoot,
  };
}
```

- [ ] **Step 8: Run all tests**

```bash
cd solver && pnpm test:run
```
Expected: all PASS

- [ ] **Step 9: Implement output utility**

```typescript
// src/utils/output.ts
import chalk from "chalk";

export function success(message: string): void {
  process.stdout.write(`${chalk.green("✓")} ${message}\n`);
}

export function warn(message: string): void {
  process.stdout.write(`${chalk.yellow("⚠")} ${message}\n`);
}

export function error(message: string): void {
  process.stderr.write(`${chalk.red("✗")} ${message}\n`);
}

export function info(message: string): void {
  process.stdout.write(`${chalk.blue("→")} ${message}\n`);
}

export function heading(message: string): void {
  process.stdout.write(`\n${chalk.bold(message)}\n`);
}
```

- [ ] **Step 10: Commit**

```bash
git add solver/src/utils/ solver/tests/utils/
git commit -m "feat: add file, detection, and output utility modules"
```

---

### Task 3: Create template generators

**Files:**
- Create: `solver/src/templates/claude-md.ts`
- Create: `solver/src/templates/settings-json.ts`
- Create: `solver/src/templates/hooks/post-write.ts`
- Create: `solver/src/templates/hooks/session-end.ts`
- Create: `solver/src/templates/ecosystem/typescript/biome-json.ts`
- Create: `solver/src/templates/ecosystem/typescript/vitest-config.ts`
- Create: `solver/src/templates/ecosystem/typescript/logger.ts`
- Create: `solver/tests/templates/claude-md.test.ts`
- Create: `solver/tests/templates/settings-json.test.ts`

- [ ] **Step 1: Write failing test for CLAUDE.md generator**

```typescript
// tests/templates/claude-md.test.ts
import { describe, it, expect } from "vitest";
import { generateClaudeMd } from "../../src/templates/claude-md.js";

describe("generateClaudeMd", () => {
  const content = generateClaudeMd();

  // Identity
  it("contains solver identity", () => {
    expect(content).toContain("solver");
    expect(content).toContain("falcani");
  });

  // Product-driven thinking
  it("contains product-driven thinking directive", () => {
    expect(content).toContain("WHY it exists");
    expect(content).toContain("what problem it solves");
  });

  // Spec-driven development
  it("contains spec-driven development with OpenSpec", () => {
    expect(content).toContain("OpenSpec");
    expect(content).toContain("source of truth");
    expect(content).toContain("spec delta");
  });

  // Two-strike rule with definition
  it("contains two-strike rule with strike definition", () => {
    expect(content).toContain("2 attempts");
    expect(content).toContain("substantive approach change");
  });

  // TDD scope
  it("contains TDD scope for business logic", () => {
    expect(content).toContain("TDD");
    expect(content).toContain("business rule");
    expect(content).toContain("mutation");
    expect(content).toContain("permission");
  });

  // Decision authority
  it("contains decision authority model", () => {
    expect(content).toContain("human approval");
    expect(content).toContain("autonomous");
  });

  // Engineering signatures (3 only)
  it("contains three engineering signatures", () => {
    expect(content).toContain("error boundaries");
    expect(content).toContain("falcanized");
    expect(content).toContain("We couldn't");
  });

  // Framework infrastructure categories
  it("contains framework-mandated infrastructure categories", () => {
    expect(content).toContain("linting");
    expect(content).toContain("structured logging");
    expect(content).toContain("test runner");
  });

  // Mutation return pattern (language-agnostic)
  it("contains mutation return pattern", () => {
    expect(content).toContain("typed result");
    expect(content).toContain("success");
    expect(content).toContain("failure");
  });

  // Project stack declaration
  it("contains project stack declaration", () => {
    expect(content).toContain("Phase 0");
    expect(content).toContain("project declares");
  });

  // Code philosophy
  it("contains code philosophy", () => {
    expect(content).toContain("single responsibility");
    expect(content).toContain("comments explain WHY");
  });

  // Conventional commits
  it("contains conventional commits", () => {
    expect(content).toContain("feat:");
    expect(content).toContain("fix:");
  });

  // Challenge assumptions
  it("contains challenge assumptions directive", () => {
    expect(content).toContain("Challenge");
    expect(content).toContain("assumption");
  });

  // Apply standards contextually
  it("contains apply standards contextually", () => {
    expect(content).toContain("contextually");
  });

  // Must NOT contain library mandates
  it("does NOT contain library-specific mandates", () => {
    expect(content).not.toContain("shadcn");
    expect(content).not.toContain("Tailwind");
    expect(content).not.toContain("react-hook-form");
    expect(content).not.toContain("MongoDB");
    expect(content).not.toContain("better-auth");
    expect(content).not.toContain("Valtio");
    expect(content).not.toContain("GSAP");
    expect(content).not.toContain("Framer Motion");
  });

  // Must NOT contain removed sections
  it("does NOT contain removed sections", () => {
    expect(content).not.toContain("animation tiers");
    expect(content).not.toContain("shimmer skeleton");
    expect(content).not.toContain("View Transitions");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd solver && pnpm test:run tests/templates/claude-md.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement CLAUDE.md generator**

Create `src/templates/claude-md.ts` with the full CLAUDE.md content as defined in the spec Section 3. This is the language-agnostic core CLAUDE.md.

**Required sections (in order, all must be present):**

1. Solver identity ("you are a solver at falcani")
2. "Challenge your own assumptions" directive
3. Product-driven thinking: "Every feature, every UI element, every data point must answer WHY it exists and what problem it solves."
4. Spec-driven development: "OpenSpec is the source of truth. Code implements the spec. Changes start with a spec delta."
5. Two-strike rule: "If a fix doesn't work after 2 attempts, stop." With strike definition: "substantive approach change that fails" vs. "minor parameter tweak."
6. TDD scope: mandatory for business rules, domain logic, calculations, mutations, permissions, data transformations. SRP keeps logic testable.
7. Decision authority: architecture + stack = human approval. Implementation within spec = autonomous.
8. Three engineering signatures: (1) specific error messages "We couldn't [action] because [reason]. Try [fix]." (2) error boundaries at application error handling layer. (3) "falcanized by falcani.com" footer.
9. Framework-mandated infrastructure categories: linting + formatting, structured logging (no console output), test runner, OpenSpec. Ecosystem pack determines which tools fill each category.
10. Project stack declaration: project declares framework, UI, database, auth in Phase 0.
11. Code philosophy: descriptive function names, comments explain WHY never WHAT, composition over inheritance, single responsibility, semantic HTML, accessible by default.
12. Mutation return pattern: typed result distinguishing success from failure. Ecosystem pack defines concrete shape.
13. API response envelope pattern: consistent success/error shapes for external-facing endpoints.
14. Conventional commits: feat:, fix:, chore:, docs:
15. "Apply standards contextually" directive.

**Must NOT contain:** shadcn, Tailwind, react-hook-form, Valtio, TanStack Query, GSAP, MongoDB, better-auth, animation tiers, shimmer skeletons, View Transitions, Next.js 16 features, skills reference table.

Reference: `docs/superpowers/specs/2026-03-19-solver-framework-v2-design.md` Section 3.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd solver && pnpm test:run tests/templates/claude-md.test.ts
```
Expected: PASS

- [ ] **Step 5: Write failing test for settings.json generator**

```typescript
// tests/templates/settings-json.test.ts
import { describe, it, expect } from "vitest";
import { generateSettingsJson } from "../../src/templates/settings-json.js";

describe("generateSettingsJson", () => {
  it("allows common dev commands", () => {
    const settings = generateSettingsJson();
    const parsed = JSON.parse(settings);
    const allowed = JSON.stringify(parsed);
    expect(allowed).toContain("git");
    expect(allowed).toContain("pnpm");
  });

  it("blocks dangerous commands", () => {
    const settings = generateSettingsJson();
    const parsed = JSON.parse(settings);
    const denied = JSON.stringify(parsed.permissions?.deny || []);
    expect(denied).toContain("sudo");
  });
});
```

- [ ] **Step 6: Run test, verify fail, implement settings-json.ts, verify pass**

Create `src/templates/settings-json.ts`. Must be permissive within project (git, pnpm, biome, vitest, tsc, node, curl, ls, cat, grep, find, wc, mkdir, cp, mv, rm for files, echo, touch). Must block sudo, ssh, npm, yarn. Must NOT block git push (that's a human decision per the spec, and the CLAUDE.md already says "no git push without explicit human instruction").

- [ ] **Step 7: Implement hook templates**

Create `src/templates/hooks/post-write.ts` — generates a shell script that:
1. Runs Biome on the written file (lint + format)
2. Checks if the file exceeds 400 lines and outputs a warning if so (does not block)
Must handle the file path argument from Claude Code's PostToolUse hook.

Create `src/templates/hooks/post-test.ts` — generates a shell script that runs the test runner (Vitest for TS, GoogleTest for C++) on newly created test files. Must detect test files by naming convention (`.test.ts`, `.spec.ts`).

Create `src/templates/hooks/session-end.ts` — generates a shell script that runs `tsc --noEmit` (for TS projects).

All are string generators that return shell script content. Each takes an `ecosystem` parameter to produce the right commands.

- [ ] **Step 8: Implement TypeScript ecosystem templates**

Create `src/templates/ecosystem/typescript/biome-json.ts` — biome.json with noConsole: error, formatting rules. Note: do NOT include `indentWidth` in the template so that existing project settings are preserved during merge.

Create `src/templates/ecosystem/typescript/vitest-config.ts` — minimal vitest.config.ts.

Create `src/templates/ecosystem/typescript/logger.ts` — lib/logger.ts with Pino setup, pretty in dev, JSON in production.

Create `src/templates/recommendations.ts` — generates a `docs/solver-ts-recommendations.md` file listing battle-tested library recommendations per the spec Section 8 table (Zod, react-hook-form, Valtio, TanStack Query, shadcn/ui, Tailwind, GSAP, better-auth, MongoDB native driver — all as recommendations, not mandates, with alternatives listed).

Each is a string generator returning the file content.

- [ ] **Step 9: Run all tests**

```bash
cd solver && pnpm test:run
```
Expected: all PASS

- [ ] **Step 10: Commit**

```bash
git add solver/src/templates/ solver/tests/templates/
git commit -m "feat: add template generators for CLAUDE.md, settings, hooks, and TS ecosystem"
```

---

### Task 4: Implement `solver init`

**Files:**
- Create: `solver/src/commands/init.ts`
- Create: `solver/tests/commands/init.test.ts`
- Modify: `solver/src/index.ts` — register init command

- [ ] **Step 1: Write failing test for init command**

```typescript
// tests/commands/init.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { executeInit } from "../../src/commands/init.js";
import { mkdtemp, rm, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileExists } from "../../src/utils/files.js";

describe("executeInit", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-init-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("creates CLAUDE.md in empty project", async () => {
    await executeInit(tempDir, { ecosystem: "ts" });
    expect(await fileExists(join(tempDir, "CLAUDE.md"))).toBe(true);
  });

  it("creates .claude/settings.json", async () => {
    await executeInit(tempDir, { ecosystem: "ts" });
    expect(await fileExists(join(tempDir, ".claude", "settings.json"))).toBe(true);
  });

  it("creates .claude/hooks directory", async () => {
    await executeInit(tempDir, { ecosystem: "ts" });
    expect(await fileExists(join(tempDir, ".claude", "hooks"))).toBe(true);
  });

  it("creates biome.json for ts ecosystem", async () => {
    await executeInit(tempDir, { ecosystem: "ts" });
    expect(await fileExists(join(tempDir, "biome.json"))).toBe(true);
  });

  it("creates vitest.config.ts for ts ecosystem", async () => {
    await executeInit(tempDir, { ecosystem: "ts" });
    expect(await fileExists(join(tempDir, "vitest.config.ts"))).toBe(true);
  });

  it("creates lib/logger.ts for ts ecosystem", async () => {
    await executeInit(tempDir, { ecosystem: "ts" });
    expect(await fileExists(join(tempDir, "lib", "logger.ts"))).toBe(true);
  });

  it("skips OpenSpec init if openspec/ exists", async () => {
    await mkdir(join(tempDir, "openspec"));
    const result = await executeInit(tempDir, { ecosystem: "ts" });
    expect(result.openspecSkipped).toBe(true);
  });

  it("reports conflict when CLAUDE.md already exists with different content", async () => {
    await writeFile(join(tempDir, "CLAUDE.md"), "# custom content");
    const result = await executeInit(tempDir, { ecosystem: "ts" });
    expect(result.conflicts).toContain("CLAUDE.md");
  });

  it("merges into existing biome.json", async () => {
    await writeFile(
      join(tempDir, "biome.json"),
      JSON.stringify({ formatter: { indentWidth: 4 } })
    );
    await executeInit(tempDir, { ecosystem: "ts" });
    const content = JSON.parse(
      await readFile(join(tempDir, "biome.json"), "utf-8")
    );
    expect(content.formatter.indentWidth).toBe(4);
    expect(content.linter.rules.suspicious.noConsole).toBe("error");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd solver && pnpm test:run tests/commands/init.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement init command**

```typescript
// src/commands/init.ts
import type { InitOptions, Ecosystem } from "../types.js";
import { detectProjectState } from "../utils/detect.js";
import { writeFileIfNotExists, mergeJsonFile, ensureDir } from "../utils/files.js";
import { success, warn, info, heading, error } from "../utils/output.js";
import { generateClaudeMd } from "../templates/claude-md.js";
import { generateSettingsJson } from "../templates/settings-json.js";
import { generatePostWriteHook } from "../templates/hooks/post-write.js";
import { generatePostTestHook } from "../templates/hooks/post-test.js";
import { generateSessionEndHook } from "../templates/hooks/session-end.js";
import { generateRecommendations } from "../templates/recommendations.js";
import { generateBiomeJson } from "../templates/ecosystem/typescript/biome-json.js";
import { generateVitestConfig } from "../templates/ecosystem/typescript/vitest-config.js";
import { generateLogger } from "../templates/ecosystem/typescript/logger.js";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { chmod } from "node:fs/promises";

interface InitResult {
  conflicts: string[];
  openspecSkipped: boolean;
}

export async function executeInit(
  projectRoot: string,
  options: InitOptions
): Promise<InitResult> {
  const state = await detectProjectState(projectRoot);
  const ecosystem = options.ecosystem || "ts";
  const result: InitResult = { conflicts: [], openspecSkipped: false };

  heading("solver init");

  // Core framework files
  info("Creating core framework files...");

  const claudeResult = await writeFileIfNotExists(
    join(projectRoot, "CLAUDE.md"),
    generateClaudeMd()
  );
  if (claudeResult.action === "created") {
    success("Created CLAUDE.md");
  } else if (claudeResult.action === "conflict") {
    warn("CLAUDE.md already exists with different content — review manually");
    result.conflicts.push("CLAUDE.md");
  } else {
    info("CLAUDE.md already up to date");
  }

  // .claude directory
  await ensureDir(join(projectRoot, ".claude", "hooks"));
  await ensureDir(join(projectRoot, ".claude", "skills"));
  // Note: skills/ is intentionally empty after init. Plan 2 populates it with pattern-based skills.

  // Settings — merge if exists
  if (state.hasClaudeDir) {
    const settingsResult = await mergeJsonFile(
      join(projectRoot, ".claude", "settings.json"),
      JSON.parse(generateSettingsJson())
    );
    if (settingsResult.action === "merged") {
      success("Merged framework rules into existing .claude/settings.json");
    } else {
      success("Created .claude/settings.json");
    }
  } else {
    await writeFileIfNotExists(
      join(projectRoot, ".claude", "settings.json"),
      generateSettingsJson()
    );
    success("Created .claude/settings.json");
  }

  // Hooks — check for conflicts before writing
  for (const [name, generator] of [
    ["post-write.sh", () => generatePostWriteHook(ecosystem)],
    ["post-test.sh", () => generatePostTestHook(ecosystem)],
    ["session-end.sh", () => generateSessionEndHook(ecosystem)],
  ] as const) {
    const hookPath = join(projectRoot, ".claude", "hooks", name);
    const hookResult = await writeFileIfNotExists(hookPath, generator());
    if (hookResult.action === "created") {
      await chmod(hookPath, 0o755);
      success(`Created ${name} hook`);
    } else if (hookResult.action === "conflict") {
      warn(`${name} already exists with different content — keeping existing`);
    } else {
      info(`${name} already up to date`);
    }
  }

  // Ecosystem-specific files
  if (ecosystem === "ts") {
    info("Installing TypeScript ecosystem pack...");

    if (state.hasBiomeJson) {
      await mergeJsonFile(
        join(projectRoot, "biome.json"),
        JSON.parse(generateBiomeJson())
      );
      success("Merged framework rules into existing biome.json");
    } else {
      await writeFileIfNotExists(
        join(projectRoot, "biome.json"),
        generateBiomeJson()
      );
      success("Created biome.json");
    }

    await writeFileIfNotExists(
      join(projectRoot, "vitest.config.ts"),
      generateVitestConfig()
    );
    success("Created vitest.config.ts");

    await ensureDir(join(projectRoot, "lib"));
    await writeFileIfNotExists(
      join(projectRoot, "lib", "logger.ts"),
      generateLogger()
    );
    success("Created lib/logger.ts");

    await ensureDir(join(projectRoot, "docs"));
    await writeFileIfNotExists(
      join(projectRoot, "docs", "solver-ts-recommendations.md"),
      generateRecommendations()
    );
    success("Created docs/solver-ts-recommendations.md");
  }

  // OpenSpec
  if (state.hasOpenSpec) {
    info("OpenSpec already initialized — skipping");
    result.openspecSkipped = true;
  } else {
    info("Initializing OpenSpec...");
    try {
      execSync("npx @fission-ai/openspec@latest init", {
        cwd: projectRoot,
        stdio: "inherit",
      });
      success("OpenSpec initialized");
    } catch {
      warn("OpenSpec init failed — run 'openspec init' manually");
    }
  }

  heading("Done");
  if (result.conflicts.length > 0) {
    warn(`${result.conflicts.length} conflict(s) need manual review`);
  }

  return result;
}
```

- [ ] **Step 4: Register init command in index.ts**

```typescript
// Update src/index.ts to add:
import { executeInit } from "./commands/init.js";

program
  .command("init")
  .description("Scaffold solver framework into the current project")
  .option("--ecosystem <type>", "Ecosystem tooling pack (ts|cpp)", "ts")
  .action(async (options) => {
    await executeInit(process.cwd(), { ecosystem: options.ecosystem });
  });
```

- [ ] **Step 5: Run tests**

```bash
cd solver && pnpm test:run
```
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add solver/src/commands/init.ts solver/tests/commands/init.test.ts solver/src/index.ts
git commit -m "feat: implement solver init command with ecosystem support"
```

---

### Task 5: Implement `solver doctor`

**Files:**
- Create: `solver/src/commands/doctor.ts`
- Create: `solver/tests/commands/doctor.test.ts`
- Modify: `solver/src/index.ts` — register doctor command

- [ ] **Step 1: Write failing test**

```typescript
// tests/commands/doctor.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { executeDoctor } from "../../src/commands/doctor.js";
import { executeInit } from "../../src/commands/init.js";
import { mkdtemp, rm, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("executeDoctor", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-doctor-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("reports all healthy after fresh init", async () => {
    await executeInit(tempDir, { ecosystem: "ts" });
    const report = await executeDoctor(tempDir);
    expect(report.claudeMd).toBe("ok");
    expect(report.settings).toBe("ok");
    expect(report.hooks).toBe("ok");
    expect(report.biome).toBe("ok");
  });

  it("reports missing CLAUDE.md", async () => {
    await executeInit(tempDir, { ecosystem: "ts" });
    await unlink(join(tempDir, "CLAUDE.md"));
    const report = await executeDoctor(tempDir);
    expect(report.claudeMd).toBe("missing");
  });

  it("reports missing biome.json", async () => {
    await executeInit(tempDir, { ecosystem: "ts" });
    await unlink(join(tempDir, "biome.json"));
    const report = await executeDoctor(tempDir);
    expect(report.biome).toBe("missing");
  });
});
```

- [ ] **Step 2: Run test, verify fail**

- [ ] **Step 3: Implement doctor command**

The doctor checks: CLAUDE.md exists, .claude/settings.json exists and is valid JSON, .claude/hooks/ directory exists with hook scripts, biome.json exists (for TS), OpenSpec is initialized (openspec/ directory exists). Reports each as "ok", "missing", or "invalid" with fix instructions.

- [ ] **Step 4: Register in index.ts, run tests, verify pass**

- [ ] **Step 5: Commit**

```bash
git add solver/src/commands/doctor.ts solver/tests/commands/doctor.test.ts solver/src/index.ts
git commit -m "feat: implement solver doctor command"
```

---

### Task 6: Implement `solver uninstall`

**Files:**
- Create: `solver/src/commands/uninstall.ts`
- Create: `solver/tests/commands/uninstall.test.ts`
- Modify: `solver/src/index.ts` — register uninstall command

- [ ] **Step 1: Write failing test**

```typescript
// tests/commands/uninstall.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { executeUninstall } from "../../src/commands/uninstall.js";
import { executeInit } from "../../src/commands/init.js";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileExists } from "../../src/utils/files.js";

describe("executeUninstall", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-uninstall-"));
    await executeInit(tempDir, { ecosystem: "ts" });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("removes CLAUDE.md", async () => {
    await executeUninstall(tempDir);
    expect(await fileExists(join(tempDir, "CLAUDE.md"))).toBe(false);
  });

  it("removes .claude/hooks", async () => {
    await executeUninstall(tempDir);
    expect(await fileExists(join(tempDir, ".claude", "hooks"))).toBe(false);
  });

  it("removes .claude/skills (framework-generated)", async () => {
    await executeUninstall(tempDir);
    expect(await fileExists(join(tempDir, ".claude", "skills"))).toBe(false);
  });

  it("keeps project source code untouched", async () => {
    await writeFile(join(tempDir, "src.ts"), "const x = 1;");
    await executeUninstall(tempDir);
    expect(await fileExists(join(tempDir, "src.ts"))).toBe(true);
  });

  it("keeps openspec/ directory", async () => {
    // OpenSpec specs are project artifacts, not framework files
    await executeUninstall(tempDir);
    // openspec/ may or may not exist depending on init, but uninstall should not touch it
  });
});
```

- [ ] **Step 2: Run test, verify fail**

- [ ] **Step 3: Implement uninstall command**

Removes: CLAUDE.md, .claude/hooks/ (framework hooks), .claude/skills/ (framework skills), .claude/settings.json (framework settings). Keeps: all project source code, openspec/ directory, biome.json (project may have customized it), vitest.config.ts (same), lib/logger.ts (project may depend on it).

- [ ] **Step 4: Register in index.ts, run tests, verify pass**

- [ ] **Step 5: Commit**

```bash
git add solver/src/commands/uninstall.ts solver/tests/commands/uninstall.test.ts solver/src/index.ts
git commit -m "feat: implement solver uninstall command"
```

---

### Task 7: Implement `solver update`

**Files:**
- Create: `solver/src/commands/update.ts`
- Create: `solver/tests/commands/update.test.ts`
- Modify: `solver/src/index.ts` — register update command

- [ ] **Step 1: Write failing test**

```typescript
// tests/commands/update.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { compareFrameworkFiles } from "../../src/commands/update.js";
import { executeInit } from "../../src/commands/init.js";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("compareFrameworkFiles", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-update-"));
    await executeInit(tempDir, { ecosystem: "ts" });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("reports no changes when files match templates", async () => {
    const diffs = await compareFrameworkFiles(tempDir, "ts");
    const hasChanges = diffs.some((d) => d.status === "differs");
    expect(hasChanges).toBe(false);
  });

  it("detects when CLAUDE.md has been modified", async () => {
    await writeFile(join(tempDir, "CLAUDE.md"), "# modified");
    const diffs = await compareFrameworkFiles(tempDir, "ts");
    const claudeDiff = diffs.find((d) => d.file === "CLAUDE.md");
    expect(claudeDiff?.status).toBe("differs");
  });
});
```

- [ ] **Step 2: Run test, verify fail**

- [ ] **Step 3: Implement update command**

The update command compares each framework-generated file against the current template version. For each file, reports: "up to date", "differs" (shows diff), or "missing". Does NOT auto-apply changes. The human reviews the diff and decides.

The interactive `executeUpdate` function iterates through diffs and for each one that "differs", outputs the diff and offers to apply. For CLI testing purposes, `compareFrameworkFiles` is the pure function that produces the diff list.

- [ ] **Step 4: Register in index.ts, run tests, verify pass**

- [ ] **Step 5: Commit**

```bash
git add solver/src/commands/update.ts solver/tests/commands/update.test.ts solver/src/index.ts
git commit -m "feat: implement solver update command"
```

---

### Task 8: Integration test and npm publish preparation

**Files:**
- Modify: `solver/package.json` — npm publish config
- Create: `solver/README.md`
- Create: `solver/tests/integration.test.ts`

- [ ] **Step 1: Write integration test**

```typescript
// tests/integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { executeInit } from "../src/commands/init.js";
import { executeDoctor } from "../src/commands/doctor.js";
import { executeUninstall } from "../src/commands/uninstall.js";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileExists } from "../src/utils/files.js";

describe("full lifecycle: init → doctor → uninstall", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-integration-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("completes full lifecycle without errors", async () => {
    // Init
    const initResult = await executeInit(tempDir, { ecosystem: "ts" });
    expect(initResult.conflicts).toHaveLength(0);

    // Verify CLAUDE.md content
    const claudeMd = await readFile(join(tempDir, "CLAUDE.md"), "utf-8");
    expect(claudeMd).toContain("solver");
    expect(claudeMd).toContain("OpenSpec");
    expect(claudeMd).not.toContain("shadcn");

    // Doctor reports healthy
    const doctorReport = await executeDoctor(tempDir);
    expect(doctorReport.claudeMd).toBe("ok");
    expect(doctorReport.settings).toBe("ok");
    expect(doctorReport.hooks).toBe("ok");
    expect(doctorReport.biome).toBe("ok");

    // Uninstall removes framework files
    await executeUninstall(tempDir);
    expect(await fileExists(join(tempDir, "CLAUDE.md"))).toBe(false);
    expect(await fileExists(join(tempDir, ".claude", "hooks"))).toBe(false);

    // But keeps ecosystem files
    expect(await fileExists(join(tempDir, "biome.json"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run integration test**

```bash
cd solver && pnpm test:run tests/integration.test.ts
```
Expected: PASS

- [ ] **Step 3: Update package.json for npm publish**

```json
{
  "name": "@falcani/solver",
  "version": "0.1.0",
  "description": "falcani solver framework — pattern authority for AI-assisted development",
  "keywords": ["cli", "framework", "ai", "development", "patterns"],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/falcani/solver"
  },
  "files": ["dist", "README.md"],
  "publishConfig": {
    "access": "public"
  }
}
```

- [ ] **Step 4: Create README.md**

Minimal README with: what the CLI does, install command (`npm install -g @falcani/solver`), quick start (`solver init --ecosystem ts`), command reference table, link to spec document.

- [ ] **Step 5: Run all tests**

```bash
cd solver && pnpm test:run
```
Expected: all PASS

- [ ] **Step 6: Build and verify**

```bash
cd solver && pnpm build && node dist/index.js --help
```
Expected: all commands listed

- [ ] **Step 7: Commit**

```bash
git add solver/
git commit -m "feat: add integration tests and npm publish config"
```

---

## Summary

| Task | What it produces | Tests |
|---|---|---|
| 1. Project skeleton | CLI entry point, types, config files | Build verification |
| 2. Utility modules | File ops, project detection, output formatting | 8 unit tests |
| 3. Template generators | CLAUDE.md, settings, hooks, TS ecosystem files | 9 unit tests |
| 4. solver init | Full initialization with collision handling | 9 unit tests |
| 5. solver doctor | Health check reporting | 3 unit tests |
| 6. solver uninstall | Clean framework removal | 5 unit tests |
| 7. solver update | Diff-based update with human consent | 2 unit tests |
| 8. Integration | Full lifecycle test, npm publish prep | 1 integration test |

**Next plans:**
- Plan 2: 8 pattern-based skills (depends on this plan completing)
- Plan 3: Analysis commands — scan, audit, report, migrate (depends on Plans 1 and 2)
