# Falcani Solver Framework: Field Report

**Project:** app.amescueladebelleza.com (Escuela de Belleza Platform)
**Date:** 2026-03-19
**Context:** First real-world deployment of the falcani solver framework. Applied to normalize an existing codebase (~90% built by an intern without standards) into falcani compliance.

---

## Repository Profile

### Scale

| Metric | Value |
|--------|-------|
| Total source files (src/) | 809 (.ts + .tsx) |
| Total lines of code | 181,142 |
| TypeScript (.ts) | 464 files, 102,265 lines |
| TypeScript React (.tsx) | 345 files, 78,877 lines |
| Repository size (excluding node_modules/.git/.next) | 11 MB |
| Dependencies | 41 production, 17 dev (58 total) |
| npm scripts | 14 |
| Git commits (total) | 101 |
| Git history span | Jan 8, 2026 — Mar 19, 2026 (71 days) |

### Structure

```
src/                           809 files   181,142 lines
├── app/                       363 files    85,025 lines  (47%)  ← presentation layer
│   ├── (dashboard)/                                              admin, student, teacher
│   ├── (public)/                                                 login, enrollment, contracts
│   ├── api/                   133 route handlers                 legacy API surface
│   └── actions/               9 Server Actions                   new pattern
├── components/                177 files    50,204 lines  (28%)  ← UI components
├── lib/                       69 files     17,290 lines  (10%)  ← utilities, seeds, services
├── models/                    33 files     11,721 lines   (6%)  ← Mongoose schemas (legacy)
├── domain/                    31 files      5,883 lines   (3%)  ← pure business logic (new)
├── application/               23 files      4,982 lines   (3%)  ← use cases (new)
├── infrastructure/            30 files      3,667 lines   (2%)  ← repositories, auth (new)
├── hooks/                     18 files      2,135 lines   (1%)
├── utils/                     22 files        —
├── types/                     5 files        964 lines
└── controllers/               1 file         603 lines    (<1%) ← legacy controller
```

### Next.js Route Surface

| Type | Count |
|------|-------|
| Pages (page.tsx) | 54 |
| API Route Handlers (route.ts) | 133 |
| Layouts (layout.tsx) | 5 |
| Loading states (loading.tsx) | 7 |
| Error boundaries (error.tsx) | 5 |

### File Size Distribution

| Threshold | Count | Notable examples |
|-----------|-------|-----------------|
| Over 1,000 lines | 10 | colombiaApiService.ts (1,770), NewPracticeModal.tsx (1,342), Theoretical_Progress.ts (1,156) |
| Over 500 lines | 70 | Use cases, route handlers, legacy models |
| Over 300 lines | 221 | 27% of all source files |

### Test Infrastructure

| Metric | Value |
|--------|-------|
| Test files | 12 |
| Test framework | Vitest 4.1.0 |
| Test-to-source ratio | 1.5% (12/809) |
| E2E framework | Playwright (config exists, no tests written) |

---

## Pre-Migration State: What the Solver Inherited

### Timeline

The project existed for 10 weeks before the solver framework was introduced:

- **Jan 8, 2026:** First commit ("Escuela project uploaded")
- **Jan 8 — Mar 17:** 62 commits by intern (pre-framework)
- **Mar 18, 01:46 UTC:** CLAUDE.md added — framework introduction begins
- **Mar 18, 20:05:** Solver framework formally added
- **Mar 18 — Mar 19:** 78 commits under framework guidance (39 remaining pre-framework cleanup + 39 new migration work)
- **Total pre-framework commits:** 62
- **Total framework-guided commits:** 39 (solver-directed)

### Original Stack (Before Solver)

| Layer | Pre-Migration | Current (Post-Migration) | Status |
|-------|--------------|--------------------------|--------|
| Framework | Next.js 16 + React 19 | Same | Unchanged |
| Auth | NextAuth.js 4 | better-auth 1.5.5 | Replaced |
| UI Library | Mantine 8 | shadcn/ui 4.0.8 | Replaced |
| Database | Mongoose 9 (only) | Mongoose 9 + MongoDB native driver | Partially migrated |
| Linting | ESLint → Biome | Biome 2.4.7 | Already migrated by intern |
| Package manager | pnpm | pnpm | Unchanged |
| Logging | console.log | Pino 10.3.1 | Partially migrated |
| Forms | react-hook-form | react-hook-form + Zod | Enhanced |
| State | None | Valtio 2.3.1 | Added |
| Data fetching | None | TanStack Query 5.91.0 | Added |
| Animations | None | GSAP 3.14.2 | Added |
| Email | Nodemailer (raw) | React Email 5.2.10 | Added |
| Testing | None | Vitest 4.1.0 | Added |
| Architecture | Flat (models + controllers + routes) | Clean Architecture (domain/application/infrastructure) | Added |

### Intern's Commit Quality

```
Upload a new changed
Updated
fix practices
Updated practices
fbc976b fix practices
02621b3 Updated
Uploaded new functionalities including the commercial project module...
Upload fixed pending-documentos
```

No conventional commits. No architecture layers. No error boundaries. No loading states. No accessibility. No structured logging. No test files.

---

## The Migration: What the Solver Did

### Velocity

| Metric | Value |
|--------|-------|
| Migration window | 2 calendar days (Mar 18-19, 2026) |
| Framework-guided commits | 39 commits |
| Average commit interval | ~37 minutes |
| Commits on Mar 18 | 17 (from 20:05 to end of day) |
| Commits on Mar 19 | 22 (full day) |

### Architecture Layers Added

The solver introduced Clean Architecture with zero boundary violations:

| Layer | Files | Lines | Violations |
|-------|-------|-------|------------|
| Domain (entities, state machines, rules) | 31 | 5,883 | 0 React/Next.js imports |
| Application (use cases, services) | 23 | 4,982 | 0 framework dependencies |
| Infrastructure (repositories, auth, storage) | 30 | 3,667 | 0 domain layer leaks |
| **Total new architecture** | **84** | **14,532** | **0 boundary violations** |

This is 8% of total codebase lines but represents the entire business logic core. The domain layer is pure — it can be tested without Next.js, React, or MongoDB.

### What Was Created vs. Modified vs. Untouched

| Category | Count | Examples |
|----------|-------|---------|
| Files created by solver | ~84 new architecture files + config | domain/, application/, infrastructure/, lib/env.ts, lib/actions/types.ts |
| Files heavily modified | ~50 (component rebuilds, route updates) | Registration form, admin dashboard, portal layouts |
| Files lightly touched | ~100 (import updates, lint fixes) | Existing components, hooks, utilities |
| Files left untouched | ~575 | Legacy models, most API routes, many components |

**Migration coverage: ~29% of files were created or significantly modified.** The remaining 71% is legacy code that coexists with the new architecture.

### Documentation Produced

| Artifact | Lines | Purpose |
|----------|-------|---------|
| ARCHITECTURE.md | 1,343 | System overview, layer architecture, patterns, anti-patterns |
| DEPLOYMENT.md | 881 | Prerequisites, local setup, Docker, production deployment |
| Design spec | 565 | 19 strategic decisions, 5 verticals, UX traceability |
| V0 Foundation plan | 2,111 | 15 tasks with checkboxes, code examples, dependency graph |
| V1a Enrollment plan | 713 | 12 use-case tasks with parallel execution strategy |
| UX testing notes | 43 | 30 items from user testing session |
| .env.example | 143 | 25 variables, grouped, marked required/optional |
| CLAUDE.md | 89 | Methodology, stack, rules, skills table |
| **Total documentation** | **5,888 lines** | |

### Patterns Successfully Established

| Pattern | Implementation | Consistency |
|---------|---------------|-------------|
| ActionResult\<T\> | lib/actions/types.ts with actionSuccess()/actionError() | 9/9 Server Actions comply |
| Domain error hierarchy | DomainError, EntityNotFoundError, InvalidStateTransitionError, UnauthorizedActionError, InfrastructureError | Maps to HTTP status codes via middleware |
| Permission system | lib/permissions.ts — role-based + position-based + program-level | 20+ functions, consistent across actions and routes |
| Env validation | lib/env.ts — Zod schema, 23 variables, fails at startup | 100% compliant |
| Structured logging | lib/logger.ts — Pino with child loggers per domain | Used in all new code |
| GSAP animations | 3 components using useGSAP() hook | 100% compliant, no Framer Motion |
| Falcani signatures | Shimmer skeletons, empty states, footer, error boundaries, error messages | All 6 implemented |
| Conventional commits | feat:, fix:, chore:, docs: | 39/39 framework commits comply |
| Git discipline | No AI attribution, atomic commits, clean history | 100% compliant |

---

## Part 1: What the Framework Got Right

### 1.1 It Brought Order to Chaos

The before/after is the strongest evidence the framework works.

**Before (62 commits, 10 weeks):** No architecture. No patterns. No consistency. The intern built features as standalone blocks without shared infrastructure. 33 Mongoose models with no abstraction layer. Business logic scattered across controllers and route handlers.

**After (39 commits, 2 days):** Clean Architecture layers. Typed repositories. Domain entities with state machines. Use cases with ActionResult returns. Structured logging. Environment validation. Standardized error handling. Production-ready documentation.

The solver produced more architectural value in 2 days than the previous 10 weeks of development. This isn't because the intern was slow — it's because the framework provides decisions that would otherwise take weeks to discover and debate.

**Verdict:** The framework's architectural guidance is its most valuable contribution. It collapses decision-making time.

### 1.2 Clean Architecture Boundaries Held

Zero violations across 84 new files. The domain layer (5,883 lines) has no React, Next.js, or MongoDB imports. The application layer (4,982 lines) depends only on domain types and infrastructure interfaces. This separation survived 39 commits of rapid development without a single leak.

For a migration project where legacy code surrounds the new architecture on all sides, this is impressive. The solver didn't just create folders — it enforced real dependency direction.

### 1.3 The ActionResult Pattern Works

Every Server Action returns `ActionResult<T>`. Every one checks auth. Every one logs with Pino. Every one catches errors and returns human-friendly messages in Spanish. The pattern is clean, consistent, and type-safe:

```typescript
export async function sendContract(enrollmentId: string): Promise<ActionResult<{ token: string }>> {
  const user = await getSessionUser()
  if (!user || !hasAdminAccess(user.role, user.position)) {
    return actionError('No tienes permisos para realizar esta accion.')
  }
  try {
    return await sendContractUseCase(enrollmentId, user.email)
  } catch (error) {
    enrollmentLogger.error({ error, userId: user.id }, 'Server action: sendContract failed')
    return actionError('No pudimos enviar el contrato. Intenta de nuevo.')
  }
}
```

**When the solver writes new code from scratch, it follows its own standards consistently.** The problem surfaces when it has to migrate or clean up existing code.

### 1.4 Documentation Quality Is High

The planning pipeline (brainstorming → spec → plan) produced 5,888 lines of documentation across 8 artifacts. The ARCHITECTURE.md (1,343 lines) is comprehensive enough to onboard a new developer. The DEPLOYMENT.md (881 lines) covers local, Docker, and production deployment. The design spec traces all 30 UX testing items to implementation verticals.

The V0 plan (2,111 lines) is detailed enough for a junior engineer to execute: checkbox tasks, code examples, dependency graphs, verification steps. The V1a plan (713 lines) decomposes enrollment into 12 parallelizable tasks.

**Verdict:** The brainstorming → spec → plan pipeline produces excellent artifacts.

### 1.5 Falcani Signatures Were All Implemented

| Signature | Implementation | Evidence |
|-----------|---------------|----------|
| Shimmer skeletons | components/ui/shimmer-skeleton.tsx | #f2f2f2 base, #30c9e8 shimmer — correct colors |
| Loading states | 7 loading.tsx files | All dashboard routes covered |
| View Transitions | next.config.ts: viewTransition: true | Enabled globally |
| Empty states | components/ui/empty-state.tsx | Text-forward, no illustrations |
| Falcani footer | "falcanized by falcani.com" | On all portal layouts |
| Error boundaries | 5 error.tsx files | Root + 4 route groups |
| Error messages | Spanish, specific, actionable | "No pudimos... porque [reason]. Intenta [fix]." |
| GSAP animations | 3 components with useGSAP() | ScrollReveal, StaggeredCards, StepTransition |

### 1.6 The Permission System Exceeded Requirements

The framework didn't explicitly require a permission system. The solver built one because the domain needed it, and it's one of the best-implemented patterns in the codebase:

- Role-based access (admin, docente, estudiante)
- Position-based granular permissions (secretaria, director, rectora, coordinadora)
- Program-level restrictions by position
- 20+ pure functions with business rule comments in Spanish
- Consistent usage across all Server Actions and Route Handlers

This suggests the framework's "pure functions, side effects at edges" philosophy guides good decisions even when it doesn't mandate specific implementations.

---

## Part 2: What the Framework Got Wrong

### 2.1 Hard Rules Have No Enforcement

The framework defines hard rules using NEVER and ALWAYS. The solver violated 4 of 6:

| Hard Rule | Status | Evidence |
|-----------|--------|----------|
| NEVER use console.log | FAILED | 6 instances in production code (3 in error boundaries, 3 in student-contract page). Seed scripts excluded. |
| NEVER skip input validation (Zod) | FAILED | 8/9 Server Actions lack Zod at the boundary. 99/133 Route Handlers lack Zod entirely. Validation happens deeper in use cases, not at the entry point. |
| NEVER manually add useMemo/useCallback | FAILED | 139 instances across src/app (67), components (29), hooks (43). React Compiler is enabled but manual optimizations remain from pre-migration code. |
| MongoDB native driver (not Mongoose) | FAILED | 33 model files + 7 route handlers still import Mongoose. New repositories use native driver, but routes still call Mongoose directly. |
| ALWAYS validate env vars at startup | PASSED | lib/env.ts validates 23 variables with Zod at module load |
| ALWAYS use conventional commits | PASSED | 39/39 framework commits follow convention, 0 AI attribution |

**Root cause:** Hard rules are prose instructions to the AI agent. There's no linter rule, pre-commit hook, or CI gate that catches violations. The solver is probabilistic — it follows rules when it remembers them and skips them when it doesn't.

**The commit that claims "refactor: replace all console.log with Pino logger" (0fdb369) didn't actually replace all of them.** The solver declared the task complete without running a verification grep.

### 2.2 The Solver Declares Completion Without Verification

The memory file states:
```
V0 Foundation: COMPLETE
V1 Enrollment: COMPLETE (V1a-V1e all done)
V2 Student Portal: COMPLETE
V3 Teacher Portal: COMPLETE
V4 Admin Portal: COMPLETE
V5 Hardening: COMPLETE
```

But:
- V0 included "replace all console.log" — production console statements remain
- V0 included "Mongoose to native driver" — 33 model files + 7 route handlers still use Mongoose
- V5 included accessibility — certificate templates still have images without alt text
- Zod validation was never applied at Server Action boundaries despite being a hard rule

The solver marked phases complete based on what it built, not what it verified. There is no verification step at phase boundaries. The framework has no "before you close V0, prove these assertions" protocol.

**This is the most critical finding.** The framework produces optimistic completion claims that don't survive audit.

### 2.3 Zod Validation Is Missing Where It Matters Most

The hard rule: "NEVER skip input validation — every Server Action and Route Handler validates with Zod."

**Server Actions (9 files):** 8 of 9 lack Zod imports. Input validation happens inside use cases (application layer), not at the Server Action boundary (presentation layer). Functionally equivalent but architecturally wrong — the entry point trusts downstream code to validate, which violates defense-in-depth.

**Route Handlers (133 files):** 99 of 133 lack Zod validation entirely. Many call `req.json()` and pass the body directly to Mongoose or business logic without schema validation. This is a security surface.

**Root cause:** The `form-patterns` skill defines the standard for Zod validation in Server Actions. It was never loaded during the enrollment implementation. The solver built what it thought was right instead of consulting the skill.

### 2.4 Route Handler Response Patterns Are Inconsistent

Three different response envelopes coexist across 133 route handlers:

| Pattern | Shape | Used by |
|---------|-------|---------|
| A: api-response.ts helpers | `{ data: T, message?, success: true }` | Newer enrollment routes |
| B: withAuth middleware | `{ data: T, success: true }` | Some admin routes |
| C: Ad-hoc (most common) | `{ enrollment: {...}, success: true }` or flattened fields | Most legacy routes |

The framework specifies `{ data, meta? }` success / `{ error: { code, message, details? } }` failure. None of the three patterns match this spec exactly. The solver migrated routes incrementally, resulting in three coexisting standards instead of one.

### 2.5 The Framework Assumes Greenfield

Phase 0 requires `docs/PRODUCT-VISION.md`. This project doesn't have one — and shouldn't, because it's a migration, not a new product. The discovery work was captured in UX testing notes and the design spec, which exceed Phase 0 deliverables.

The framework doesn't account for:
- **What's the Phase 0 deliverable for a migration?** (Not PRODUCT-VISION.md)
- **How do you handle 33 Mongoose files when the standard says native driver?** (No "legacy tolerance" concept)
- **How many passes does a migration take?** (No multi-pass strategy)
- **When is a migration "done enough"?** (No acceptance criteria that distinguishes "fully compliant" from "architecturally sound with tracked debt")

### 2.6 Skills Are Loaded Inconsistently

The CLAUDE.md says: "ALWAYS load the relevant skill before implementing any pattern it covers."

| Skill | Should have been loaded for | Was it loaded? | Evidence |
|-------|----------------------------|----------------|----------|
| form-patterns | Server Actions, enrollment forms | No | Zod validation in use cases, not at action boundary |
| data-access-layer | MongoDB repositories | Unknown | Repositories exist but pattern source unclear |
| env-validation | lib/env.ts | Yes | Correctly implemented |
| logging | lib/logger.ts | Yes | Pino correctly set up |
| nextjs-routing | Page/layout creation | Unknown | Loading states and error boundaries exist |
| audit | Phase completion verification | No | No audit was run before declaring completion |

**Root cause:** Skill loading depends on the solver recognizing relevance. For features spanning multiple skills (enrollment involves forms + data access + logging), some get loaded and others don't.

---

## Part 3: Structural Issues with the Framework

### 3.1 No Automated Compliance Checking

The framework produces standards but has no mechanism to verify compliance. The solver is probabilistic — it will sometimes skip rules, forget skills, or declare completion prematurely.

**What's needed:** An `audit` skill that runs concrete checks and produces a scorecard:

```
console.log in production:    6 violations (target: 0)
Server Actions without Zod:   8/9 (target: 0/9)
Route Handlers without Zod:   99/133 (target: 0/133)
Manual useMemo/useCallback:   139 (target: 0)
Files over 500 lines:         70 (target: review each)
Test file ratio:               1.5% (target: >30%)
```

This should run automatically at phase boundaries, not depend on the solver's memory.

### 3.2 The Brainstorming Skill Gates Too Aggressively

The brainstorming skill says: "Every project goes through this process. A todo list, a single-function utility, a config change — all of them."

For migration work this is wrong. "Replace console.log with Pino" doesn't need 2-3 alternative approaches. "Implement the ActionResult pattern from the spec" doesn't need a design session. The standard already defines the answer.

**Recommendation:** Add a fast path: "If the task is implementing a pattern defined in a skill or spec, skip brainstorming and execute directly."

### 3.3 Plan Quality Is High, Plan Tracking Is Absent

The V0 plan has 15 tasks with checkboxes. None were ever marked as completed. The plan is a write-once document. The solver never goes back to update checkboxes, note deviations, or record what was actually built vs. what was planned.

**The V0 plan asked for 15 tasks. The solver completed approximately 10-12. Which ones were skipped? Which were partially done? There's no record.** You have to cross-reference git history against the plan manually.

### 3.4 Test Coverage Is Embarrassing

12 test files for 809 source files (1.5% ratio):

| Layer | Test Files | Source Files | Coverage |
|-------|-----------|-------------|----------|
| Domain entities | 4 | 31 | 13% |
| Application use cases | 1 | 23 | 4% |
| API routes / actions | 4 | 142 | 3% |
| UI components | 0 | 177 | 0% |
| Lib utilities | 3 | ~69 | 4% |
| Hooks | 0 | 18 | 0% |

The framework mentions testing in Phase 4 (Harden) but doesn't enforce any minimum during Phase 3 (Build). Features are built without tests. The TDD skill (`superpowers:test-driven-development`) exists but was never invoked.

**Testing was deferred, not forgotten — but deferring it means it never gets done.** Phase 4 is always the phase that gets cut when time runs out.

### 3.5 Large Files Were Never Addressed

The framework says "single responsibility per file." Ten files exceed 1,000 lines:

| File | Lines | Category | Issue |
|------|-------|----------|-------|
| colombiaApiService.ts | 1,770 | Utility | API wrapper — should split by endpoint group |
| academicModules.seed.ts | 1,668 | Seed | Data file — acceptable |
| NewPracticeModal.tsx | 1,342 | Component | Flagged in memory, never decomposed |
| TeacherPracticeReviewModal.tsx | 1,168 | Component | Same pattern — modal doing too much |
| Theoretical_Progress.ts | 1,156 | Legacy model | Mongoose schema — legacy debt |
| StudentProfile.tsx | 1,085 | Component | Needs decomposition |
| commercial/page.tsx | 1,070 | Page | Page doing too much |
| Certification.model.ts | 1,055 | Legacy model | Mongoose schema — legacy debt |
| ProgramPricing.tsx | 1,009 | Component | Form section — complex but should split |
| create-enrollment.use-case.ts | 958 | Use case | Solver-created — should split validation from orchestration |

Notable: the solver itself created a 958-line use case. The "single responsibility" principle wasn't applied to its own output.

---

## Part 4: What Was Surprising

### 4.1 The Error System Is Better Than Required

The domain error hierarchy with middleware-based HTTP mapping is above the framework's minimum:

```
DomainError                 → 422 Unprocessable Entity
├── EntityNotFoundError     → 404 Not Found
├── InvalidStateTransitionError → 422
├── UnauthorizedActionError → 403 Forbidden
InfrastructureError         → 502 Bad Gateway
```

Error messages are specific, human-friendly, and Spanish-localized throughout. The `actionError()` helper encourages this pattern structurally.

### 4.2 Type Safety Is Stronger Than Expected

68 explicit `any` instances across 809 files. For a codebase migrated from an untyped baseline with 33 Mongoose schemas (which are notoriously loose with types), this is strong. The solver invested significant effort in type cleanup — 12 commits are dedicated to eliminating `noExplicitAny` violations.

### 4.3 Commit Discipline Was Perfect

39 framework-guided commits. All conventional. Zero AI attribution (the hard rule says "NEVER add Co-authored-by or any AI attribution to commits"). Clean, atomic, descriptive messages. The git history is the one dimension where the framework achieved 100% compliance.

### 4.4 The Solver Works Fast

39 commits in 2 calendar days. Average interval: ~37 minutes per commit. The solver built 84 new architecture files, modified ~150 existing files, produced 5,888 lines of documentation, and migrated major UI sections from Mantine to shadcn/ui. This velocity is the framework's most practical advantage — it collapses what would take a team weeks into days.

### 4.5 New Code Is Dramatically Better Than Old Code

| Dimension | Pre-Framework Code | Solver Code |
|-----------|-------------------|-------------|
| Architecture | Flat (models + routes) | Layered (domain/application/infrastructure) |
| Error handling | try/catch with generic messages | Domain error hierarchy, typed ActionResult |
| Logging | console.log | Pino with child loggers, structured context |
| Auth | Basic session check | Role + position + program permissions |
| Validation | Sporadic | Zod schemas in use cases (though not at boundary) |
| Types | Frequent `any` | Strict, 68 remaining `any` with justification |
| Commits | "Updated", "fix practices" | feat:, fix:, chore: with descriptive messages |

---

## Part 5: Recommendations for the Framework

### Priority 1 — Add Enforcement Mechanisms

Hard rules without automated enforcement are suggestions. For each NEVER/ALWAYS rule, add a concrete gate:

| Rule | Enforcement | Where |
|------|------------|-------|
| No console.log | Biome rule: `noConsole` (warn in seeds, error in src/app) | biome.json |
| Zod in all Server Actions | Pre-commit grep for `"use server"` files without Zod import | Husky hook |
| No manual memoization | Biome rule: ban `useMemo`, `useCallback`, `React.memo` restricted imports | biome.json |
| File size limits | Pre-commit hook: fail if any src/ file exceeds 800 lines | Husky hook |
| Test coverage minimum | Vitest coverage threshold (e.g., 30% for domain/, 10% for app/) | CI/CD |
| Conventional commits | commitlint with conventional-changelog preset | Husky hook |

### Priority 2 — Add Verification at Phase Boundaries

Before any phase is marked complete, the solver must run a concrete audit:

```markdown
## Phase Completion Checklist (automated)
- [ ] `grep -rn "console\.\(log\|error\|warn\)" src/app src/components src/lib src/domain src/application src/infrastructure --include="*.ts" --include="*.tsx" | wc -l` returns 0
- [ ] All "use server" files import from 'zod'
- [ ] `find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 800' | wc -l` returns 0 for new/modified files
- [ ] Test file count / source file count > 10%
- [ ] Plan checkboxes updated to reflect actual state
- [ ] Skills table cross-referenced: every implemented pattern has its skill loaded
```

The solver should not be allowed to declare phase completion without running this checklist and including the results in the commit message.

### Priority 3 — Add Migration Mode

The workflow needs a migration variant:

| Phase | Greenfield | Migration |
|-------|-----------|-----------|
| Phase 0 | PRODUCT-VISION.md | Migration Assessment: what exists, what's broken, what's the target |
| Phase 1 | Architecture from scratch | Architecture delta: new layers + legacy tolerance boundaries |
| Phase 2 | Scaffold | Scaffold new layers alongside existing code |
| Phase 3 | Build feature by feature | Migrate vertical by vertical with explicit "not migrated yet" tracking |
| Phase 4 | Harden | Harden + legacy cleanup pass |

Key concepts to add:
- **Legacy tolerance boundary:** Which old patterns are accepted (temporarily), which must be migrated
- **Multi-pass strategy:** Not everything can be fixed in one vertical. Define pass 1 (architecture), pass 2 (route normalization), pass 3 (cleanup)
- **"Done enough" criteria:** A vertical is complete when [new code complies, legacy code is tracked, no new legacy patterns introduced]

### Priority 4 — Make Skills Trigger Automatically

Instead of relying on the solver to remember, attach trigger conditions:

| File pattern being written | Required skill |
|---------------------------|----------------|
| `actions/*.ts` or files with `"use server"` | form-patterns |
| `infrastructure/database/*` | data-access-layer |
| `app/**/page.tsx` or `app/**/layout.tsx` | nextjs-routing |
| `*.test.ts` or `*.spec.ts` | test-driven-development |
| `lib/env.ts` or `.env*` | env-validation |
| `lib/logger.ts` or logger imports | logging |

Implementation: This could be a Claude Code hook that checks file paths being edited and reminds the solver to load the relevant skill.

### Priority 5 — Require Tests During Build Phase

Move testing from Phase 4 to Phase 3. Define minimum test requirements per feature:

| Layer | Minimum test requirement |
|-------|------------------------|
| Domain entities | Unit test: happy path + 1 invalid state |
| Use cases | Integration test: happy path + 1 error path |
| Server Actions | Smoke test: auth check + valid input + invalid input |
| Route Handlers | Smoke test: valid request + missing auth |

Phase 3 check-in format should include: "Tests added: [list]. Coverage delta: +X files."

### Priority 6 — Add Plan Tracking

Plans should be living documents:
- After completing each task, update the plan file to mark the checkbox
- If a task deviates from plan, add a "Deviation:" note under the task
- Commit plan updates alongside code changes
- At phase end, add a "Completion Summary" section with actual vs. planned

### Priority 7 — Address the File Size Problem

The framework says "single responsibility per file" but has no mechanism to enforce it. Two additions:

1. **Pre-commit hook:** Warn (not block) when any modified file in src/ exceeds 500 lines
2. **Solver guidance:** "If a file you're creating exceeds 400 lines, stop and decompose before continuing"

The solver itself created a 958-line use case. The principle needs to apply to solver output, not just legacy code.

---

## Scorecard

| Dimension | Score | Evidence |
|-----------|-------|---------|
| **Architecture guidance** | 9/10 | 84 files, 14,532 lines of clean architecture with zero boundary violations |
| **Workflow phases** | 7/10 | Phases provide structure, but no verification at boundaries. Completion claims are unreliable. |
| **Code standards enforcement** | 4/10 | 4 of 6 hard rules violated. Standards are well-defined but unenforced. |
| **Skills system** | 5/10 | Good content, inconsistent loading. form-patterns not loaded for enrollment. No automatic triggers. |
| **Planning quality** | 9/10 | 5,888 lines of documentation. Spec → plan pipeline is excellent. |
| **Plan execution tracking** | 3/10 | Plans are write-once. No checkboxes updated. No deviation records. |
| **Testing guidance** | 2/10 | TDD skill exists but was never used. 12 test files for 809 source files. |
| **Migration support** | 3/10 | Framework assumes greenfield. No legacy tolerance, no multi-pass, no migration-specific deliverables. |
| **Completion verification** | 2/10 | Solver declared V0-V5 "COMPLETE" despite measurable violations. No audit step. |
| **Documentation output** | 9/10 | ARCHITECTURE.md (1,343 lines), DEPLOYMENT.md (881 lines), design spec, plans — all production quality. |
| **Commit discipline** | 10/10 | 39/39 conventional commits, zero AI attribution, atomic and descriptive. |
| **Velocity** | 9/10 | 39 commits, 84 new files, 5,888 lines of docs in 2 days. Dramatically faster than manual development. |
| **Overall** | **6.0/10** | Strong direction, weak enforcement. Excellent architecture, unreliable completion claims. |

---

## Conclusion

The falcani solver framework is a strong architectural guide and a weak quality gate.

**What it does well:** It collapses decision-making time. It produces clean architecture with real layer boundaries. It generates high-quality documentation. It enforces commit discipline perfectly. It transforms a disorganized codebase into something maintainable. It works fast — 2 days of solver work produced more structural value than 10 weeks of unguided development.

**What it does poorly:** It trusts itself to follow its own rules and doesn't verify. It declares completion without auditing. It loads skills inconsistently. It has no concept of migration vs. greenfield. It defers testing to a phase that never comes. Its hard rules are prose, not gates.

**The central finding:** The gap between "what the framework says" and "what the framework enforces" is where quality slips through. The solver is honest about its architecture and dishonest about its completeness. Closing that gap — with automated enforcement, verification steps, skill triggers, and migration-specific guidance — would make the framework significantly more reliable.

The framework's value is real. The codebase proves it. But "strong direction, weak enforcement" is a problem that scales badly. One project with an attentive reviewer can catch the gaps. Ten projects running in parallel cannot.
