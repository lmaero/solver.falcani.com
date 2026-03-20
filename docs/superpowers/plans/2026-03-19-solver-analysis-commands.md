# Analysis Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 4 agent-assisted CLI commands: `solver scan`, `solver audit`, `solver report`, and `solver migrate`. These commands orchestrate AI analysis of codebases rather than performing static analysis themselves.

**Architecture:** Each command follows the same pattern: gather project data (file counts, structure, dependencies), format it as structured context, then either output a report directly (audit, report) or generate a markdown document with the analysis prompt embedded for the agent to execute (scan, migrate). The CLI does the mechanical work (counting files, reading configs, detecting patterns); the AI agent does the semantic work (understanding architecture, judging quality, generating diagrams).

**Key design decision:** These commands run INSIDE a Claude Code session. The CLI gathers data and produces a structured prompt/report. For scan and migrate, the output is a markdown file that also serves as the agent's analysis template. The agent reads the template, fills in the semantic sections (architecture diagrams, quality assessments), and saves the completed report.

**Tech Stack:** Node.js, TypeScript, existing solver utilities (files, detect, output)

**Spec:** `docs/superpowers/specs/2026-03-19-solver-framework-v2-design.md` Sections 2, 5

**Plan scope:** Plan 3 of 3. Depends on Plans 1-2 (CLI + skills complete).

---

## File Structure

```
solver/src/
├── commands/
│   ├── scan.ts                 # solver scan
│   ├── audit.ts                # solver audit
│   ├── report.ts               # solver report
│   └── migrate.ts              # solver migrate
├── analysis/
│   ├── collector.ts            # Gathers project metrics (file counts, structure, deps)
│   ├── scorecard.ts            # Audit scorecard checks (grep-based violations)
│   └── templates.ts            # Report/scan markdown templates
solver/tests/
├── commands/
│   ├── scan.test.ts
│   ├── audit.test.ts
│   ├── report.test.ts
│   └── migrate.test.ts
├── analysis/
│   ├── collector.test.ts
│   └── scorecard.test.ts
```

---

### Task 1: Build the project data collector

**Files:**
- Create: `solver/src/analysis/collector.ts`
- Create: `solver/tests/analysis/collector.test.ts`

The collector gathers mechanical data about a project. No AI needed — this is file counting, config reading, and pattern detection.

- [ ] **Step 1: Write failing tests**

```typescript
// tests/analysis/collector.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { collectProjectData } from "../../src/analysis/collector.js";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("collectProjectData", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-collector-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("counts source files by extension", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "index.ts"), "const x = 1;");
    await writeFile(join(tempDir, "src", "app.tsx"), "export default () => null;");
    await writeFile(join(tempDir, "src", "style.css"), "body {}");
    const data = await collectProjectData(tempDir);
    expect(data.fileCounts.ts).toBe(1);
    expect(data.fileCounts.tsx).toBe(1);
    expect(data.fileCounts.css).toBe(1);
  });

  it("detects package.json dependencies", async () => {
    await writeFile(join(tempDir, "package.json"), JSON.stringify({
      dependencies: { react: "^19.0.0", next: "^16.0.0" },
      devDependencies: { vitest: "^4.0.0" }
    }));
    const data = await collectProjectData(tempDir);
    expect(data.dependencies).toContain("react");
    expect(data.dependencies).toContain("next");
    expect(data.devDependencies).toContain("vitest");
  });

  it("detects project framework from dependencies", async () => {
    await writeFile(join(tempDir, "package.json"), JSON.stringify({
      dependencies: { next: "^16.0.0" }
    }));
    const data = await collectProjectData(tempDir);
    expect(data.detectedFramework).toBe("next");
  });

  it("counts test files", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await mkdir(join(tempDir, "tests"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "const x = 1;");
    await writeFile(join(tempDir, "tests", "app.test.ts"), "test('x', () => {});");
    await writeFile(join(tempDir, "src", "util.spec.ts"), "test('y', () => {});");
    const data = await collectProjectData(tempDir);
    expect(data.testFileCount).toBe(2);
    expect(data.sourceFileCount).toBeGreaterThanOrEqual(1);
  });

  it("lists files over 400 lines", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    const longContent = Array(450).fill("const x = 1;").join("\n");
    await writeFile(join(tempDir, "src", "big.ts"), longContent);
    await writeFile(join(tempDir, "src", "small.ts"), "const x = 1;");
    const data = await collectProjectData(tempDir);
    expect(data.largeFiles.length).toBe(1);
    expect(data.largeFiles[0].path).toContain("big.ts");
    expect(data.largeFiles[0].lines).toBeGreaterThanOrEqual(400);
  });

  it("returns empty data for empty project", async () => {
    const data = await collectProjectData(tempDir);
    expect(data.sourceFileCount).toBe(0);
    expect(data.testFileCount).toBe(0);
    expect(data.dependencies).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

- [ ] **Step 3: Implement collector**

The collector walks the project directory (excluding node_modules, .git, .next, dist, build) and gathers:

```typescript
export interface ProjectData {
  projectRoot: string;
  fileCounts: Record<string, number>;  // by extension
  sourceFileCount: number;             // .ts, .tsx, .js, .jsx, .py, .cpp, .h, etc.
  testFileCount: number;               // *.test.*, *.spec.*
  testCoverageRatio: number;           // testFileCount / sourceFileCount
  dependencies: string[];              // from package.json dependencies
  devDependencies: string[];           // from package.json devDependencies
  detectedFramework: string | null;    // "next", "vite", "express", etc.
  largeFiles: { path: string; lines: number }[];  // files over 400 lines
  directoryStructure: string[];        // top-level and second-level dirs
  hasOpenSpec: boolean;
  hasCiConfig: boolean;                // .github/workflows, .gitlab-ci.yml, etc.
  hasDockerfile: boolean;
  hasTests: boolean;
}
```

Use simple file system traversal. No external dependencies. Exclude binary files, node_modules, .git, dist, build, .next, __pycache__.

- [ ] **Step 4: Run tests, verify pass**

- [ ] **Step 5: Commit**

```bash
git add solver/src/analysis/collector.ts solver/tests/analysis/collector.test.ts
git commit -m "feat: add project data collector for analysis commands"
```

---

### Task 2: Build the audit scorecard

**Files:**
- Create: `solver/src/analysis/scorecard.ts`
- Create: `solver/tests/analysis/scorecard.test.ts`

The scorecard runs mechanical checks that can be done via file reading and pattern matching. No AI needed.

- [ ] **Step 1: Write failing tests**

```typescript
// tests/analysis/scorecard.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { runAuditChecks } from "../../src/analysis/scorecard.js";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("runAuditChecks", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-audit-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("detects console.log violations", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), 'console.log("hello");');
    const result = await runAuditChecks(tempDir);
    expect(result.consoleViolations).toBe(1);
  });

  it("ignores console.log in test files", async () => {
    await mkdir(join(tempDir, "tests"), { recursive: true });
    await writeFile(join(tempDir, "tests", "app.test.ts"), 'console.log("debug");');
    const result = await runAuditChecks(tempDir);
    expect(result.consoleViolations).toBe(0);
  });

  it("counts files over 400 lines", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    const longContent = Array(450).fill("const x = 1;").join("\n");
    await writeFile(join(tempDir, "src", "big.ts"), longContent);
    const result = await runAuditChecks(tempDir);
    expect(result.largeFiles).toHaveLength(1);
  });

  it("calculates test coverage ratio", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await mkdir(join(tempDir, "tests"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    await writeFile(join(tempDir, "src", "util.ts"), "export const y = 2;");
    await writeFile(join(tempDir, "tests", "app.test.ts"), "test('x', () => {});");
    const result = await runAuditChecks(tempDir);
    expect(result.testCoverageRatio).toBeCloseTo(0.5);
  });

  it("produces a formatted scorecard string", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    const result = await runAuditChecks(tempDir);
    expect(result.scorecard).toContain("console.log");
    expect(result.scorecard).toContain("Test coverage");
    expect(result.scorecard).toContain("Files over 400");
  });

  it("returns passing scorecard for clean project", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await mkdir(join(tempDir, "tests"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    await writeFile(join(tempDir, "tests", "app.test.ts"), "test('x', () => {});");
    const result = await runAuditChecks(tempDir);
    expect(result.consoleViolations).toBe(0);
    expect(result.largeFiles).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests, verify fail**

- [ ] **Step 3: Implement scorecard**

```typescript
export interface AuditResult {
  consoleViolations: number;
  consoleViolationFiles: string[];
  largeFiles: { path: string; lines: number }[];
  testCoverageRatio: number;
  sourceFileCount: number;
  testFileCount: number;
  hasOpenSpec: boolean;
  scorecard: string;  // Formatted scorecard for display
  passing: boolean;   // true if no critical violations
}
```

The scorecard checks:
1. **console.log/console.error in production code** — scan .ts/.tsx/.js/.jsx files (excluding test files, node_modules, dist)
2. **Files over 400 lines** — list them with line counts
3. **Test coverage ratio** — test files / source files
4. **OpenSpec status** — openspec/ directory exists

Format the scorecard as:
```
console.log in production:       0 violations  ✓
Test coverage (source):          50% (1/2)     ✓
Files over 400 lines:            0             ✓
OpenSpec initialized:            yes           ✓
```

- [ ] **Step 4: Run tests, verify pass**

- [ ] **Step 5: Commit**

```bash
git add solver/src/analysis/scorecard.ts solver/tests/analysis/scorecard.test.ts
git commit -m "feat: add audit scorecard checks"
```

---

### Task 3: Implement `solver audit`

**Files:**
- Create: `solver/src/commands/audit.ts`
- Create: `solver/tests/commands/audit.test.ts`
- Modify: `solver/src/index.ts` — register audit command

- [ ] **Step 1: Write failing tests**

```typescript
// tests/commands/audit.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { executeAudit } from "../../src/commands/audit.js";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("executeAudit", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-audit-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("returns passing result for clean project", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await mkdir(join(tempDir, "tests"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    await writeFile(join(tempDir, "tests", "app.test.ts"), "test('x', () => {});");
    const result = await executeAudit(tempDir);
    expect(result.passing).toBe(true);
  });

  it("returns failing result when console.log found", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), 'console.log("bad");');
    const result = await executeAudit(tempDir);
    expect(result.passing).toBe(false);
    expect(result.consoleViolations).toBeGreaterThan(0);
  });

  it("produces a scorecard string", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "export const x = 1;");
    const result = await executeAudit(tempDir);
    expect(result.scorecard).toBeDefined();
    expect(typeof result.scorecard).toBe("string");
  });
});
```

- [ ] **Step 2: Implement audit command**

The audit command calls `runAuditChecks()`, displays the scorecard, and sets exit code 1 if failing. Simple wrapper around the scorecard module.

- [ ] **Step 3: Register in index.ts, run tests, commit**

```bash
git add solver/src/commands/audit.ts solver/tests/commands/audit.test.ts solver/src/index.ts
git commit -m "feat: implement solver audit command"
```

---

### Task 4: Build report templates

**Files:**
- Create: `solver/src/analysis/templates.ts`

- [ ] **Step 1: Implement scan report template**

The scan template is a markdown document with sections for the agent to fill in. The CLI pre-fills mechanical data (file counts, stack, structure) and leaves semantic sections (architecture diagrams, quality assessment, recommendations) as prompts for the agent.

```typescript
export function generateScanTemplate(data: ProjectData): string {
  // Returns markdown with:
  // - Pre-filled: date, stack table, file counts, dependency list, large files
  // - Agent prompts: architecture overview mermaid, data flow mermaid,
  //   what's missing, what's broken, what could be better, recommendations
}

export function generateReportTemplate(data: ProjectData, auditResult: AuditResult): string {
  // Returns markdown with:
  // - Pre-filled: date, audit scorecard, file metrics
  // - Agent prompts: what was built, patterns followed/violated,
  //   what the framework got right/wrong, recommendations
}

export function generateMigrateTemplate(data: ProjectData): string {
  // Returns markdown with:
  // - Pre-filled: current stack, structure, dependency inventory
  // - Agent prompts: migration assessment, what to normalize,
  //   what to leave as tracked debt, OpenSpec change proposals
}
```

- [ ] **Step 2: Commit**

```bash
git add solver/src/analysis/templates.ts
git commit -m "feat: add scan, report, and migrate templates"
```

---

### Task 5: Implement `solver scan`, `solver report`, and `solver migrate`

**Files:**
- Create: `solver/src/commands/scan.ts`
- Create: `solver/src/commands/report.ts`
- Create: `solver/src/commands/migrate.ts`
- Create: `solver/tests/commands/scan.test.ts`
- Create: `solver/tests/commands/report.test.ts`
- Create: `solver/tests/commands/migrate.test.ts`
- Modify: `solver/src/index.ts` — register all 3 commands

- [ ] **Step 1: Write failing tests for scan**

```typescript
// tests/commands/scan.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { executeScan } from "../../src/commands/scan.js";
import { mkdtemp, rm, writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileExists } from "../../src/utils/files.js";

describe("executeScan", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-scan-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("creates a scan report file", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "const x = 1;");
    const result = await executeScan(tempDir);
    expect(await fileExists(result.reportPath)).toBe(true);
  });

  it("report contains project name and date", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "const x = 1;");
    const result = await executeScan(tempDir);
    const content = await readFile(result.reportPath, "utf-8");
    expect(content).toContain("Solver Scan");
    expect(content).toContain("Date:");
  });

  it("report contains stack information when package.json exists", async () => {
    await writeFile(join(tempDir, "package.json"), JSON.stringify({
      dependencies: { react: "^19.0.0" }
    }));
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "const x = 1;");
    const result = await executeScan(tempDir);
    const content = await readFile(result.reportPath, "utf-8");
    expect(content).toContain("react");
  });

  it("report contains architecture diagram placeholder", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "const x = 1;");
    const result = await executeScan(tempDir);
    const content = await readFile(result.reportPath, "utf-8");
    expect(content).toContain("Architecture Overview");
    expect(content).toContain("mermaid");
  });
});
```

- [ ] **Step 2: Write failing tests for report**

```typescript
// tests/commands/report.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { executeReport } from "../../src/commands/report.js";
import { mkdtemp, rm, writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileExists } from "../../src/utils/files.js";

describe("executeReport", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-report-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("creates a report file", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "const x = 1;");
    const result = await executeReport(tempDir);
    expect(await fileExists(result.reportPath)).toBe(true);
  });

  it("report contains audit scorecard", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "const x = 1;");
    const result = await executeReport(tempDir);
    const content = await readFile(result.reportPath, "utf-8");
    expect(content).toContain("Audit Results");
    expect(content).toContain("console.log");
  });

  it("report contains framework assessment sections", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "const x = 1;");
    const result = await executeReport(tempDir);
    const content = await readFile(result.reportPath, "utf-8");
    expect(content).toContain("What the Framework Got Right");
    expect(content).toContain("What the Framework Got Wrong");
    expect(content).toContain("Recommendations");
  });
});
```

- [ ] **Step 3: Write failing tests for migrate**

```typescript
// tests/commands/migrate.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { executeMigrate } from "../../src/commands/migrate.js";
import { mkdtemp, rm, writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileExists } from "../../src/utils/files.js";

describe("executeMigrate", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-migrate-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("creates a migration assessment file", async () => {
    await writeFile(join(tempDir, "package.json"), JSON.stringify({
      dependencies: { express: "^4.0.0" }
    }));
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "const x = 1;");
    const result = await executeMigrate(tempDir);
    expect(await fileExists(result.reportPath)).toBe(true);
  });

  it("assessment contains current stack", async () => {
    await writeFile(join(tempDir, "package.json"), JSON.stringify({
      dependencies: { express: "^4.0.0", mongoose: "^8.0.0" }
    }));
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "const x = 1;");
    const result = await executeMigrate(tempDir);
    const content = await readFile(result.reportPath, "utf-8");
    expect(content).toContain("express");
    expect(content).toContain("mongoose");
  });

  it("assessment contains migration sections", async () => {
    await writeFile(join(tempDir, "package.json"), JSON.stringify({
      dependencies: { react: "^19.0.0" }
    }));
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "const x = 1;");
    const result = await executeMigrate(tempDir);
    const content = await readFile(result.reportPath, "utf-8");
    expect(content).toContain("Migration Assessment");
    expect(content).toContain("normalize");
    expect(content).toContain("debt");
  });
});
```

- [ ] **Step 4: Implement all three commands**

Each command:
1. Calls `collectProjectData(projectRoot)` to gather metrics
2. For audit: also calls `runAuditChecks(projectRoot)`
3. Generates the report using the appropriate template
4. Writes the report to `docs/solver-{scan|report|migrate}-YYYY-MM-DD.md`
5. Returns `{ reportPath: string }`

**scan:** `executeScan(projectRoot)` — collects data, generates scan template with architecture diagram placeholders, saves to docs/
**report:** `executeReport(projectRoot)` — collects data + runs audit, generates report template with scorecard pre-filled, saves to docs/
**migrate:** `executeMigrate(projectRoot)` — collects data, generates migration assessment template, saves to docs/. Internally calls scan data collection (per spec: "runs solver scan internally").

- [ ] **Step 5: Register all 3 in index.ts**

- [ ] **Step 6: Run full test suite**

```bash
cd /Users/lmaero/Projects/solver.falcani.com/solver && pnpm test:run
```

- [ ] **Step 7: Commit**

```bash
git add solver/src/commands/ solver/src/analysis/ solver/tests/
git commit -m "feat: implement solver scan, report, and migrate commands"
```

---

### Task 6: Final integration test for complete CLI

**Files:**
- Modify: `solver/tests/integration.test.ts` — add analysis commands
- Modify: `solver/README.md` — mark all commands as available

- [ ] **Step 1: Add analysis commands to integration test**

```typescript
// Add to existing integration test:
it("solver scan produces a report", async () => {
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
```

- [ ] **Step 2: Update README to mark all commands as available**

Remove "coming soon" labels from scan, audit, report, migrate.

- [ ] **Step 3: Run full test suite**

```bash
cd /Users/lmaero/Projects/solver.falcani.com/solver && pnpm test:run
```

- [ ] **Step 4: Build and verify all commands**

```bash
cd /Users/lmaero/Projects/solver.falcani.com/solver && pnpm build && node dist/index.js --help
```
Expected: all 7 commands listed (init, scan, audit, doctor, migrate, report, update, uninstall)

- [ ] **Step 5: Commit**

```bash
git add solver/
git commit -m "feat: complete CLI with all analysis commands and integration tests"
```

---

## Summary

| Task | What it produces | Tests |
|---|---|---|
| 1. Project data collector | File counting, dependency detection, framework detection, large file detection | 6 unit tests |
| 2. Audit scorecard | Console.log scanning, file size checking, test coverage ratio, formatted output | 6 unit tests |
| 3. solver audit | Audit command wired to scorecard | 3 unit tests |
| 4. Report templates | Markdown templates for scan, report, migrate with pre-filled data and agent prompts | Template functions (tested through commands) |
| 5. scan + report + migrate | Three analysis commands generating markdown reports | 10 unit tests |
| 6. Final integration | Full CLI verified with all 7+1 commands | 4 integration tests |

**After this plan:** The `@falcani/solver` CLI is feature-complete for v0.1.0. All commands from the spec are implemented. Ready for real-world testing.
