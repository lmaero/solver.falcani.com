# falcani solver framework v2 — design spec

> This document captures every decision made during the brainstorming session between Luis (founder) and Claude on 2026-03-19. It is the authoritative reference for building the v2 framework. Every decision traces back to evidence from 4 real-world experiments and 14 findings from the founder's analysis.

---

## 1. what the framework IS

The falcani solver framework is a **pattern authority and engineering discipline system** for AI-assisted software development. It is not a starter kit, not a boilerplate, and not a library collection.

It operates on three principles drawn from falcani's philosophy (implicit in behavior, never stated to the user):

- **Simplify** — enforce the minimum rules that prevent the maximum damage. No rule exists without evidence from a real failure.
- **Optimize** — patterns over libraries. The framework teaches agents HOW to build, not WHAT to build with.
- **Falcanize** — every delivered project carries engineering quality as its signature. The quality of the stitching tells you who made it.

### three layers

**Language-agnostic core** (any project, any language):

- OpenSpec for spec-driven development
- Workflow phases with human gates
- Product-driven thinking ("WHY does this exist and what problem does it solve?")
- Decision authority: architecture + stack = human approval, implementation within spec = autonomous
- Domain separation patterns
- Engineering signatures: specific error messages, error boundaries, falcanized footer
- Mutation patterns: mutations return a typed result that distinguishes success from failure. API responses use a consistent envelope. Each ecosystem pack defines the concrete shape (TypeScript: ActionResult\<T\> discriminated union; C++: `std::expected` or equivalent).
- Two-strike rule: 2 failed fix attempts → stop, explain to the human what was tried and why it failed, present alternative approaches, wait for direction. Do not attempt a third fix or restructure architecture without human approval.
- Subagent coordination: spec is the single source of truth, orchestrator verifies subagent work against spec via `/opsx:verify`

**Ecosystem tooling packs** (language-specific, installed via `--ecosystem` flag):

- TypeScript pack (Stage 1, built now): Biome, Pino + pino-pretty, Vitest. Library recommendations (not mandates) for schema validation, forms, state management, etc.
- C++ pack (Stage 2, built when a real project demands it): clang-format, spdlog, GoogleTest/Catch2, equivalent patterns.
- Future packs: built only when a real project demands them, never from imagination.

**Project layer** (declared by human in Phase 0):

- Framework choice (Next.js, Vite, Astro, HyperExpress, whatever fits)
- UI approach (any library or none)
- Database and driver/ORM
- Auth solution
- State management, forms, animation — all project decisions

### what the framework does NOT do

- Prescribe UI libraries, CSS approaches, or visual patterns
- Dictate database, auth, or state management choices
- Generate boilerplate application code
- Make architecture decisions without human approval
- Declare work complete without verification

### what the framework DOES do

- Enforces engineering discipline through automated hooks and gates
- Teaches patterns that work with any stack
- Makes every decision traceable through OpenSpec specs
- Challenges every feature with "WHY does this exist?"
- Catches violations mechanically, not through agent memory
- Provides CLI tools to scan, audit, migrate, and report on any codebase
- Gets out of the way cleanly when it doesn't fit

---

## 2. the CLI — `@falcani/solver`

The CLI is the framework's distribution and maintenance tool. Node.js, published to npm as `@falcani/solver`. Minimal dependencies.

### commands

| command | purpose |
|---|---|
| `solver init [--ecosystem ts\|cpp]` | Scaffold framework into any project. Installs ecosystem pack, runs `openspec init` with Claude Code integration, creates CLAUDE.md, hooks, settings. Zero questions about application dependencies. On existing projects: if CLAUDE.md exists, shows diff and asks before overwriting. If `openspec/` exists, skips OpenSpec init. If `biome.json` exists, merges framework rules (e.g., noConsole) into existing config. If `.claude/` exists, merges settings and hooks without overwriting custom entries. |
| `solver scan` | Agent-assisted codebase analysis. The CLI orchestrates; the AI agent reads the code and produces the analysis. Catalogs repo structure, stack, dependencies, architecture pattern, what exists (routes, components, APIs, models, tests). Reports what's missing, broken, and improvable. Generates high-level Mermaid diagrams (architecture overview as dependency graph, data flow as sequence diagram). Output: `docs/solver-scan-YYYY-MM-DD.md`. Opinionated about engineering quality, NOT about stack choices. |
| `solver audit` | Run phase completion checks. Produces a scorecard (see template below). The automated enforcement gate. |
| `solver doctor` | Verify framework health. All files exist, hooks registered, linter config valid, OpenSpec initialized, permissions correct. Reports what's broken and how to fix it. |
| `solver migrate` | Guided migration workflow for existing codebases. Runs `solver scan` internally for initial analysis, then generates a migration assessment as OpenSpec change proposals, identifies what to normalize vs. what to leave as tracked debt. Builds on scan output so analysis is not duplicated. |
| `solver report` | Generates a structured field report. Output: `docs/solver-report-YYYY-MM-DD.md`. See report template below. |
| `solver update` | Compare framework files against latest version. Shows diff per file. Human picks what to adopt, what to skip. Never overwrites without consent. |
| `solver uninstall` | Clean removal. Removes framework files (hooks, settings, skills). Keeps project code untouched. Professional exit. |

### solver scan output structure

```markdown
# Solver Scan — [project-name]
## Date: YYYY-MM-DD

## Architecture Overview
(Mermaid graph TD showing system's major blocks and connections)

## Data Flow
(Mermaid sequence diagram showing typical request path)

## Stack
| Layer | Technology | Version |

## What Exists
- Routes, components, API endpoints, database models, tests, auth, CI/CD

## What's Missing (engineering quality)
- Checklist of gaps against best practices

## What's Broken
- Lint errors, type errors, dead code, security concerns

## What Could Be Better
- Files over thresholds, mixed patterns, inconsistencies

## Recommended Next Steps
- Prioritized actions
```

### solver audit scorecard

```
console.log in production:       0 violations  ✓
Entry points without validation: 0/5           ✓
Test coverage (domain/):         78%           ✓
Test coverage (actions/):        40%           ✓
Files over 400 lines:            2 (listed)    ⚠
OpenSpec verify:                 passed        ✓
Spec tracking:                   all archived  ✓
```

### solver report output structure

```markdown
# Solver Report — [project-name]
## Date: YYYY-MM-DD
## Session: [duration, model, branch]

## What Was Built
- Features completed, OpenSpec changes archived

## Solver Audit Results
- Full scorecard output from `solver audit`

## Patterns Followed
- Which skills were loaded and applied

## Patterns Violated
- Deviations from standards, with explanations

## Spec Compliance
- `/opsx:verify` results across all domains

## What the Framework Got Right
- Specific evidence of framework value

## What the Framework Got Wrong
- Specific evidence of framework gaps

## Recommendations
- Changes to framework based on this project's experience
```

---

## 3. the CLAUDE.md

Concise. Library-specific instructions are gone, which reduces size despite new directives.

### what stays

- Solver identity ("you are a solver at falcani")
- "Challenge your own assumptions" directive
- Code philosophy: descriptive function names, comments explain WHY never WHAT, composition over inheritance, SRP, semantic HTML, accessible by default
- Mutation return pattern: mutations return a typed result distinguishing success from failure (ecosystem pack defines the concrete shape)
- API response envelope pattern: consistent success/error shapes for external-facing endpoints
- Conventional commits (feat:, fix:, chore:, docs:)
- "Apply standards contextually" directive

### what's new

- **Product-driven thinking:** "Every feature, every UI element, every data point must answer WHY it exists and what problem it solves. If you can't articulate the purpose, don't build it."
- **Spec-driven development:** "OpenSpec is the source of truth. Code implements the spec. Changes start with a spec delta. Verification checks code against spec."
- **Two-strike rule:** "If a fix doesn't work after 2 attempts, stop. Explain to the human what you've tried, why it failed, and what alternative approaches exist. Do not attempt a third fix or restructure the architecture without human approval."
- **TDD scope:** "TDD is mandatory for business rules, domain logic, calculations, mutations, permissions, and data transformations. SRP keeps this logic in testable pure functions, not in UI components. If a UI component contains business logic, the design is wrong."
- **Decision authority:** "Architecture and stack decisions require human approval. Implementation within an approved spec is autonomous. When ambiguous, present options with your recommendation and the WHY behind each."
- **Three engineering signatures:** (1) Error messages must be specific and human — "We couldn't [action] because [reason]. Try [fix]." (2) Error boundaries at the application's error handling layer (e.g., route-level in web apps, exception handlers in services). (3) "falcanized by falcani.com" footer on every delivered product.
- **Framework-mandated infrastructure categories:** linting + formatting, structured logging (no console output), test runner, OpenSpec (spec-driven development). Non-negotiable regardless of project stack. The ecosystem pack determines which tools fill each category (e.g., TypeScript: Biome, Pino, Vitest; C++: clang-format, spdlog, GoogleTest).
- **Project stack declaration:** "The project declares its framework, UI, database, auth, and all other dependencies in Phase 0. The framework does not prescribe these choices."
- **Two-strike definition:** A "strike" is a substantive approach change that fails to resolve the issue. Minor parameter tweaks within the same approach do not count. Switching strategies (e.g., from library A to library B, from one algorithm to another) counts as separate strikes.

### what's removed

- All library mandates (shadcn, Tailwind, react-hook-form, Valtio, TanStack Query, GSAP, MongoDB native driver, better-auth)
- The "stack" section (replaced by project declaration)
- All 6 falcani signatures (replaced by 3 engineering signatures)
- Animation tiers section
- Next.js 16 specific features section
- Skills reference table (replaced by OpenSpec + pattern skills)

---

## 4. workflow phases

The 5-phase structure survives. Internals change significantly with OpenSpec integration.

### Phase 0 — Discovery (human-driven)

- Purpose: understand the humans who will use this, the problem being solved, WHY this product needs to exist
- Human declares the project stack: framework, UI, database, auth — all decided and documented
- Product-driven interrogation: not "what features?" but "what does the user's day look like before and after?"
- OpenSpec command: `/opsx:explore` to investigate the problem space and existing codebase
- Deliverable: initial OpenSpec specs in `openspec/specs/` organized by domain, with Given/When/Then scenarios
- **Gate: human approves before Phase 1**

### Phase 1 — Architecture (spec-driven)

- OpenSpec `design.md` replaces ad-hoc architecture documents
- Architecture diagrams, data models, domain separation, tech decisions live in the spec
- For ambiguous decisions: solver presents options with WHY reasoning. Human picks.
- OpenSpec command: `/opsx:propose` to create the change with proposal, specs, design, tasks
- **Gate: human approves before Phase 2**

### Phase 2 — Scaffold

- `solver init --ecosystem ts` runs here if not already done
- Project structure created from approved architecture
- Development workflow verified: seed script works, dev server runs, auth flow completes end to end
- Part of OpenSpec's `/opsx:apply` (infrastructure tasks)
- **Gate: human approves before Phase 3**

### Phase 3 — Build (spec-driven, feature by feature)

- Each feature is an OpenSpec change: `/opsx:propose` → `/opsx:apply` → `/opsx:verify` → `/opsx:archive`
- TDD mandatory for business logic, domain, mutations, permissions, data transformations
- SRP enforced at design time — if a spec puts business logic in a UI component, the spec review catches it
- Subagents work against the spec as single source of truth. Orchestrator runs `/opsx:verify` after each subagent's work.
- Two-strike rule: 2 failed fix attempts → stop, explain to human, wait for direction
- Check-in after each feature: what was built, what deviated from spec (with spec delta), what needs review
- **Gate: `solver audit` passes before Phase 4**

### Phase 4 — Harden

- Security audit, performance, accessibility (WCAG AA)
- Testing focus: integration tests, edge cases, coverage gaps only. Business logic tests were already written via TDD in Phase 3.
- `/opsx:verify` on the full system
- `solver audit` with all checks green
- `solver report` generates the field report
- **Gate: `solver audit` passes with all checks green, report generated**

### key difference from current workflow

OpenSpec makes every phase produce living artifacts that persist in the repo. Specs, designs, task lists, and deltas are all versioned. A new solver joining the project reads `openspec/specs/` and understands the entire system without reading chat history or git log.

---

## 5. enforcement — hooks and gates

### real-time hooks (run automatically)

| trigger | hook | action |
|---|---|---|
| After every file write/edit | Linter (Biome for TS, clang-format for C++) | Format and lint. Blocks if errors. |
| After every file write/edit | File size check | Warns if file exceeds 400 lines. Doesn't block, surfaces the signal. |
| After every test file creation | Test runner (Vitest for TS, GoogleTest for C++) | Runs the new test file to verify it passes. |
| Session end | Type check (tsc for TS, compiler for C++) | Reports errors. |

### phase boundary gates (run via `solver audit`)

| check | what it verifies |
|---|---|
| No console.log/printf | Zero logging bypass instances in production code |
| Input validation at boundaries | Every entry point (action, route handler, API endpoint) validates inputs against a schema |
| Test coverage | Business logic files in domain/application layers have corresponding test files and meet minimum coverage threshold (threshold set per-project in Phase 0) |
| File size | Lists all files over 400 lines for human review |
| OpenSpec verify | `/opsx:verify` passes — implementation matches spec |
| Spec tracking | OpenSpec changes are archived or in progress — no orphaned work |

### permissions (settings.json)

- **Permissive within project directory:** solver can read, write, grep, run dev servers, run tests, use git, run any development command freely. No permission prompts for standard development operations within the project.
- **Restrictive outside:** no sudo, no ssh, no accessing files outside the project, no git push without explicit human instruction.

---

## 6. skills — pattern-based

v1 had 8 library-specific skills. v2 replaces 2 (nextjs-routing removed as framework-specific, audit replaced by CLI commands) and adds 2 (domain-patterns, testing-strategy), maintaining 8 total. All teach patterns that adapt to whatever stack the project declared.

### skills that survive (rewritten)

| current skill | new skill | what changes |
|---|---|---|
| form-patterns | action-patterns | Drops library specifics. Teaches: ActionResult\<T\> discriminated union, schema validation at the boundary, error handling shape. Works with any form/validation library. |
| data-access-layer | data-access-patterns | Drops database-specific code. Teaches: isolate data access behind a service layer, validate before writes, type your returns, log operations. Works with any database or ORM. |
| env-validation | env-validation | Removes library references. Teaches: validate all environment variables at startup against a schema, crash immediately if invalid, never access env directly — always through validated object. Project chooses the validation library. |
| logging | logging | Keeps Pino as mandated infrastructure (framework tool, not project choice). Teaches: structured logging, what to log at each level, redaction of sensitive fields, child loggers for context. |
| ci-cd | ci-cd-patterns | Drops specific CI templates. Teaches: quality gates on every push (lint, type check, test, build), deployment only from main, secrets management principles. Works with any CI system. |
| product-vision | discovery | Rewritten around product-driven thinking. Not a template — a set of questions the solver must answer: WHO feels the pain, WHAT does their day look like, WHY does this need to exist, WHAT is the experience shape and WHY that shape over others. Output feeds into OpenSpec's initial specs. |

### new skills

| skill | purpose |
|---|---|
| domain-patterns | Domain separation, entity design, state machines, pure business logic isolation. Teaches WHERE logic lives, not HOW to write it in a specific language. |
| testing-strategy | Defines the TDD boundary: what must be TDD (business rules, mutations, permissions, data transforms), what gets tests after implementation (queries, utilities), what doesn't need tests (UI, config, static content). Teaches HOW to structure testable code via SRP — if you need to test a UI component's logic, the component is doing too much. |

### skills removed

| skill | reason |
|---|---|
| nextjs-routing | Framework-specific. Project decides its framework. |
| audit | Replaced by `solver audit` and `solver scan` CLI commands. |

---

## 7. OpenSpec integration

OpenSpec is a first-class dependency, not a fork. Installed via `openspec init` during `solver init`.

### OpenSpec command reference (as used by the framework)

| command | what it does | inputs | outputs |
|---|---|---|---|
| `/opsx:explore` | Investigates the codebase and problem space. Reads code, compares approaches, creates diagrams. No artifacts committed. | Topic or question to investigate | Findings shared in conversation, optionally written to specs |
| `/opsx:propose` | Creates a change folder and generates all planning artifacts: proposal.md (why/what), specs/ (delta specs with Given/When/Then), design.md (how/architecture), tasks.md (implementation checklist) | Change name or description | `openspec/changes/<name>/` with all artifacts |
| `/opsx:apply` | Works through tasks.md, writes code, marks tasks complete. Resumable if interrupted. | Change name (optional if only one active) | Code changes + updated tasks.md with checked items |
| `/opsx:verify` | Validates three dimensions: completeness (all tasks done, all requirements implemented), correctness (matches spec intent, edge cases), coherence (design decisions reflected in code). | Change name | Report with CRITICAL/WARNING/SUGGESTION issues |
| `/opsx:archive` | Merges delta specs into main specs, moves change folder to `changes/archive/YYYY-MM-DD-<name>/`. Preserves all artifacts for audit trail. | Change name | Archived change, updated main specs |

### phase-to-command mapping

| phase | OpenSpec commands |
|---|---|
| Phase 0 — Discovery | `/opsx:explore` to investigate problem space and existing codebase |
| Phase 1 — Architecture | `/opsx:propose` to create change with proposal, specs, design, tasks |
| Phase 2 — Scaffold | `/opsx:apply` for infrastructure tasks |
| Phase 3 — Build | `/opsx:apply` per feature, `/opsx:verify` after each, `/opsx:archive` when complete |
| Phase 4 — Harden | `/opsx:verify` on full system, `solver audit`, `solver report` |

### spec organization

Specs live in `openspec/specs/` organized by domain (e.g., `specs/auth/`, `specs/payments/`, `specs/enrollment/`). Each domain has a `spec.md` with requirements and Given/When/Then scenarios.

### subagent coordination

1. OpenSpec spec is the single source of truth
2. Orchestrator decomposes the spec into tasks for subagents
3. Subagents implement their tasks and update the spec with what they actually built (spec deltas)
4. Orchestrator verifies each subagent's work against the spec using `/opsx:verify`
5. The spec replaces trust — instead of "did you finish?" the orchestrator asks "does the code match the spec?"

### conflict resolution: OpenSpec vs solver audit

When spec compliance and audit checks conflict (e.g., `/opsx:verify` passes but `solver audit` flags a file over 400 lines that the spec designed that way):

- **Audit takes precedence** for engineering quality concerns (file size, validation, logging, test coverage)
- **Spec takes precedence** for architectural and behavioral concerns (feature completeness, domain modeling, data flow)
- If both are legitimate, surface the conflict to the human for a decision

### migration workflow

Migrations are a series of OpenSpec changes: `change/auth-migration`, `change/ui-framework-swap`, `change/data-layer-normalization`. Each gets its own proposal, design, tasks, and spec deltas. Current specs describe the system as-is; changes describe what's moving.

---

## 8. ecosystem tooling packs

### TypeScript pack (Stage 1 — built now)

**Mandated infrastructure (installed by `solver init --ecosystem ts`):**

| tool | purpose |
|---|---|
| Biome | Lint + format. Configured with noConsole: error (with explicit override allowed in error boundary files via biome-ignore comment). Enforced via hook on every file write. |
| Pino + pino-pretty | Structured logging. Pretty output in dev, JSON in production. |
| Vitest | Test runner. Runs on test file creation, part of CI quality gates. |

**Recommendations (documented, not enforced):**

The TypeScript pack includes a recommendations file listing battle-tested libraries for common concerns. These are suggestions based on falcani's experience, not mandates. The project chooses.

| concern | recommended | alternatives |
|---|---|---|
| Schema validation | Zod | Valibot, ArkType, io-ts |
| Forms | react-hook-form | Mantine forms, Formik, native |
| State management | Valtio | Zustand, Jotai, none |
| Data fetching | TanStack Query | SWR, native fetch |
| UI components | shadcn/ui | Mantine, Ant Design, Radix, none |
| CSS | Tailwind CSS | CSS modules, vanilla, Panda CSS |
| Animation | GSAP | CSS transitions, View Transitions API |
| Auth | better-auth | Auth.js, Clerk, Supabase Auth |
| Database | MongoDB native driver | Mongoose, Prisma, Drizzle |

### C++ pack (Stage 2 — built when needed)

Not designed yet. Will follow the same structure: mandated infrastructure for linting, logging, and testing, plus recommendations for common concerns. Built from real experience with falcani's C++ core, not from imagination.

---

## 9. project file structure (after `solver init`)

```
project-root/
├── CLAUDE.md                          # Engineering standards (framework-generated)
├── .claude/
│   ├── settings.json                  # Permissive within project
│   ├── hooks/                         # Real-time enforcement
│   │   ├── post-write.sh             # Linter on every file write
│   │   ├── post-test.sh              # Run new test files
│   │   └── session-end.sh            # Type check on exit
│   └── skills/                        # Pattern-based skills
│       ├── action-patterns/
│       ├── data-access-patterns/
│       ├── env-validation/
│       ├── logging/
│       ├── ci-cd-patterns/
│       ├── discovery/
│       ├── domain-patterns/
│       ├── testing-strategy/
│       └── openspec-*/               # OpenSpec's own skills (auto-generated)
├── openspec/
│   ├── specs/                         # Living system specs, organized by domain
│   ├── changes/                       # Active and archived changes
│   └── config.yaml                    # OpenSpec configuration
├── biome.json                         # Linter config (TS pack)
├── vitest.config.ts                   # Test runner config (TS pack)
└── lib/
    └── logger.ts                      # Pino setup (TS pack)
```

---

## 10. decisions log

Every decision in this spec traces to evidence. This log exists so future modifications understand the WHY.

**Source documents:**
- Founder's analysis: `docs/2026_03_19-ANALYISIS_FINDINGS.md` (14 numbered points referenced below)
- Experiment reports: `docs/experiments/2026_03_19-solver_framework_*`
- Original design decisions: `docs/2026_03_18-DESIGN-DECISIONS.md`

| decision | evidence | source |
|---|---|---|
| Framework enforces patterns, not libraries | UI library mandates caused unnecessary migrations in 3/4 experiments | TránsitoFácil, MenteSerena, Ayda reports |
| Project declares stack in Phase 0, human decides | Solver rationalized away findings when stack didn't match mandates | TránsitoFácil report: "not applicable" escape hatch |
| Remove all UI library mandates | "All UI tasks were a disaster in every project" | Founder analysis point #10 |
| Product-driven thinking replaces UI prescription | Framework produced "engineer output, not product output" | MenteSerena report: dashboards visually basic |
| OpenSpec for spec-driven development | Plans were write-once documents, checkboxes never updated, completion claims unreliable | Ayda report: 2/10 completion verification score |
| Two-strike rule with human gate | falcani.com ScrollTrigger pin: 7 fix attempts before correct solution | falcani.com report: bug fix timeline |
| TDD mandatory for business logic only | Agents skip TDD when mandated universally; SRP means UI components don't need tests | MenteSerena: 87/91 tests written after implementation; Ayda: TDD never invoked |
| SRP enforced at design time | PaymentForm should not calculate — calculation is a separate testable function | Brainstorming session: founder's direct input |
| solver audit replaces self-reported completion | Solver declared V0-V5 COMPLETE while 4/6 hard rules were violated | Ayda report: "most critical finding" |
| solver scan for codebase understanding | "I saw not a single diagram of the architecture of any of the experiments" | Founder analysis point #13 |
| solver migrate as core command | 3/4 experiments were migrations, not greenfield | TránsitoFácil, MenteSerena, Ayda reports |
| solver report as core command | Framework evolves through contact with reality, not imagination | Design decisions doc: "how to improve this framework" |
| solver uninstall for clean exit | Framework should not trap projects | Brainstorming session: founder's direct input |
| Permissive settings within project | Long sessions caused constant permission prompts for basic commands | Founder analysis: session permissions friction |
| Biome, Pino, Vitest as mandated infrastructure | These are development infrastructure, not application dependencies | Brainstorming session: distinction between infrastructure and app deps |
| Language-agnostic core with ecosystem packs | falcani has a C++ core — framework must work beyond JS/TS | Brainstorming session: blind spot discovered |
| Staged ecosystem packs (TS now, C++ later) | Zero evidence on C++ agent performance. Build only when a real project demands it. | falcani philosophy: no building from imagination |
| Adopt OpenSpec, don't reinvent | 32.4k stars, actively maintained, native Claude Code integration, stack-agnostic | Founder's direct recommendation + repo verification |
| Engineering signatures reduced to 3 | Shimmer skeletons, View Transitions, empty state styling were UI prescription disguised as standards | Brainstorming session: "framework should not be attached to brand strategies" |
| falcani philosophy implicit, not explicit | "simplify. optimize. falcanize." internalized as behavior, not marketing | Brainstorming session: "keep in mind, not protagonist" |

---

*this spec was produced from a brainstorming session on 2026-03-19. every decision has evidence. nothing was imagined.*
