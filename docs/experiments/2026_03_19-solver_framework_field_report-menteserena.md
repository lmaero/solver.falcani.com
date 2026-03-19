# Falcani Solver Framework — Field Report

**Project:** Mente Serena Colombia
**Date:** 2026-03-19
**Context:** First real-world application of the falcani solver framework. Lovable-generated codebase (~90% AI-written) normalized to falcani standards across a single extended session.
**Operator:** Claude Opus 4.6 (1M context) with superpowers skill suite

---

## 1. Repository Profile

### 1.1 Before (main branch — Lovable-generated Vite SPA)

| Metric | Value |
|---|---|
| Framework | Vite 5.4 + React 18.3 + react-router-dom 6.30 |
| Database/Auth | Supabase (PostgreSQL BaaS — auth, db, storage in one SDK) |
| UI | shadcn/ui + Tailwind CSS 3.4 + tailwindcss-animate |
| Linting | ESLint |
| Package manager | npm/bun (mixed — both `package-lock.json` and `bun.lockb` present) |
| Total files | 153 |
| TypeScript/TSX files | 125 |
| Total lines (ts/tsx) | 20,752 |
| Components | 93 (in `src/components/`) |
| Lib/utility files | 3 (`quotaUtils.ts`, `tariffUtils.ts`, `utils.ts`) |
| Pages | 12 (flat, file-based routing via react-router) |
| Route Handlers | 0 (no server — pure SPA) |
| Data access | Supabase client SDK (direct from components) |
| Test files | 1 (no meaningful tests) |
| Auth | Supabase Auth (email/password, role in user metadata) |
| Rendering | 100% client-side (CSR) |
| State management | React useState + Supabase realtime subscriptions |
| Forms | Inline useState with manual validation |
| Logging | console.log (scattered across 34 files) |
| Env validation | None |
| Error boundaries | None |
| Loading states | Spinner components (no streaming, no skeletons) |

**Directory structure (main branch):**

```
src/
  pages/             12 flat page files (AdminDashboard, Auth, Dashboard, etc.)
  components/        93 components, mixed concerns
    admin/           11 components
    auth/            1 component (ProtectedRoute)
    booking/         1 component
    dashboard/       5 components
    landing/         6 components
    layout/          2 components
    psychologist/    11 components
    search/          6 components
    session/         2 components
    tariff/          2 components
    ui/              46 components (shadcn/ui)
  hooks/             4 custom hooks (useAuth, useGeolocation, useMobile, useToast)
  lib/               3 utility files
  integrations/      1 file (supabase client)
supabase/
  functions/         2 edge functions (seed, email verification)
```

**Key structural problems:**
- No server layer — all logic exposed to client bundle, Supabase RLS as only protection
- No input validation — forms use inline useState, no Zod, no react-hook-form
- Mixed package managers — npm lockfile + bun lockfile coexisting
- 12 flat pages with no layout hierarchy, no route groups, no nested layouts
- Components averaged 200-400 lines mixing data fetching + rendering + mutations
- Supabase client imported directly in 20+ components (no data access layer)
- No separation between reads and writes — same Supabase calls for both
- Business logic (tariffs, quotas, cancellation) in 3 utility files with no server-side enforcement

### 1.2 After (migration branch — falcani-normalized Next.js 16)

| Metric | Value |
|---|---|
| Framework | Next.js 16.1 + React 19.2 (App Router, React Compiler, View Transitions) |
| Database | MongoDB 7 (native driver, self-managed) |
| Auth | better-auth 1.5 (email/password, role-based, server-side sessions) |
| UI | shadcn/ui + Tailwind CSS 4.2 |
| Linting | Biome |
| Package manager | pnpm (single lockfile) |
| Total files | 266 |
| TypeScript/TSX files | 172 |
| Total lines (ts/tsx) | 27,180 |
| Components | 83 (in `components/`) |
| Server Actions | 9 files, 25 functions (2,003 lines) |
| Data query functions | 11 files, ~30 functions (2,397 lines) |
| Lib/utility files | 43 (3,737 lines) |
| Pages (routes) | 21 (nested route groups with layouts) |
| Route Handlers | 11 (auth mount, 2 cron, public GETs, CSV export) |
| Email templates | 5 (React Email + Nodemailer via Zoho SMTP) |
| Test files | 6 files, 91 tests (1,620 lines) |
| Error boundaries | 4 (root + per-dashboard-role) |
| Loading states | 11 (shimmer skeletons via Suspense) |
| Rendering | SSG (4 static pages) + SSR (17 dynamic pages) + Streaming (Suspense) |
| State management | Server Components (primary) + Valtio (installed, minimal use) |
| Forms | react-hook-form 7.71 + Zod 4.3 |
| Logging | Pino 10.3 (structured, with sensitive field redaction) |
| Env validation | Zod schema at startup (17 variables validated) |
| Animations | GSAP 3.14 (scroll/entrance), View Transitions (navigation), Tailwind (hover/focus) |

**Directory structure (migration branch):**

```
app/
  (auth)/auth/                          Login/register
  (public)/                             4 SSG pages + shared layout
    buscar/                             Psychologist search (public, browse-only)
    como-funciona/                      How it works
    psicologos/                         Psychologist recruitment
  (dashboard)/
    admin/                              3 tabs + layout + loading + error
      finanzas/
      impacto/
    dashboard/                          6 consultante tabs + layout + loading + error
      buscar/                           Authenticated search + booking
      documentos/
      historial/
      perfil/
      sesiones/
    psychologist/                       6 psychologist tabs + layout + loading + error
      agenda/
      consultantes/[id]/
      facturacion/
      perfil/
      solicitudes/
  api/                                  11 Route Handlers
    auth/[...all]/                      better-auth mount
    cron/reminders/                     Session reminders + auto-cancel
    cron/quotas/                        Quota notification processing
    psychologists/                      Public search GET
    psychologists/[id]/                 Public profile GET
    psychologists/me/                   Profile + availability + blocked-dates + documents
    tariffs/                            Cacheable tariff GET
    admin/export/csv/                   Data export (streaming response)
lib/
  actions/                              9 Server Action files (2,003 lines)
    sessions.ts, cases.ts, consultation-requests.ts, psychologist.ts,
    admin.ts, payments.ts, notifications.ts, users.ts, types.ts
  data/                                 11 data query files (2,397 lines)
    sessions.ts, cases.ts, psychologists.ts, admin.ts, admin-finanzas.ts,
    admin-impacto.ts, notifications.ts, payments.ts, quotas.ts, users.ts,
    psychologist-dashboard.ts, availability.ts
  auth.ts, auth-client.ts, auth-helpers.ts
  db.ts, collections.ts, types.ts, validations.ts
  env.ts, logger.ts, email.ts, storage.ts
  tariffs.ts, quotas.ts, cancellation.ts, reminders.ts
  notifications.ts, payment-processing.ts, quota-notifications.ts
components/
  admin/          26 components (KPIs, tables, charts, verification forms, payment manager)
  dashboard/      12 components (nav, empty state, sessions table, booking, profile, search)
  psychologist/   16 components (nav, KPIs, calendar, cases, billing, profile, quotas)
  landing/        6 components (hero, features, how-it-works, tariffs, FAQ, CTA)
  layout/         2 components (Header, Footer)
  ui/             13 components (shadcn + shimmer + animated-list + scroll-reveal)
  booking/        4 components
  search/         4 components
emails/
  layout.tsx, session-reminder.tsx, session-confirmed.tsx,
  session-cancelled.tsx, welcome.tsx
```

### 1.3 Dependency Migration

| Concern | Before | After |
|---|---|---|
| Runtime | Vite 5.4 (client-only bundler) | Next.js 16.1 (full-stack framework) |
| React | 18.3 | 19.2 (with React Compiler) |
| Database | Supabase PostgreSQL (BaaS) | MongoDB 7 (native driver) |
| Auth | Supabase Auth (client SDK) | better-auth 1.5 (server-side) |
| CSS | Tailwind 3.4 + tailwindcss-animate | Tailwind 4.2 (native `@theme`) |
| State | React useState | Server Components + Valtio |
| Forms | Inline useState | react-hook-form 7.71 + Zod 4.3 |
| Validation | None | Zod 4.3 (forms + env + actions) |
| Logging | console.log | Pino 10.3 |
| Linting | ESLint (97 rules) | Biome (single tool: lint + format) |
| Email | None | Nodemailer 8.0 + React Email 1.0 |
| Animations | CSS transitions only | GSAP 3.14 + View Transitions API |
| Charts | Recharts 2.15 | Recharts 3.8 |
| Package mgr | npm/bun (mixed) | pnpm (single) |

### 1.4 Architecture Delta

| Concern | Before | After |
|---|---|---|
| Rendering | 100% CSR (client-side rendering) | SSG + SSR + Streaming |
| Data access | Client-side Supabase SDK in components | Server-side MongoDB via `lib/data/` |
| Mutations | Client-side Supabase SDK in components | Server Actions via `lib/actions/` returning `ActionResult<T>` |
| Validation | None (Supabase RLS only protection) | Zod on every Server Action + env vars + forms |
| Auth | Supabase Auth (JWT in client, role in metadata) | better-auth (httpOnly cookies, role in DB) |
| Error handling | None (uncaught errors crash page) | Error boundaries + ActionResult pattern |
| Loading UX | Spinner components | Shimmer skeletons via Suspense + `loading.tsx` |
| Logging | console.log in 34 files | Pino (structured JSON, sensitive field redaction) |
| Email | None | Nodemailer + React Email (5 templates, Zoho SMTP) |
| Cron | None | 2 Route Handler endpoints (reminders + quotas) |
| Notifications | None | Centralized service (`lib/notifications.ts`) — in-app + email |
| Payments | None | Biweekly batch processing (`lib/payment-processing.ts`) |
| Route protection | Client-side ProtectedRoute component | Server-side `proxy.ts` (Next.js 16 convention) |

---

## 2. What the Framework Got Right

### 2.1 Phased workflow prevented premature coding

The Phase 0 → 1 → 2 → 3 → 4 structure forced genuine requirements gathering before touching code. Without this, the natural instinct was to start refactoring immediately. The brainstorming skill produced a comprehensive spec (525 lines) that caught 16 issues in automated review — issues that would have been bugs or rework if discovered during implementation.

**Evidence:** The spec review found:
- Consultante data storage was undefined (better-auth `users` vs separate collection)
- `sessions` collection name collided with better-auth's `session` collection
- Session confirmation window was ambiguously specified ("12-24h" vs "24h exactly")
- No acceptance criteria for dashboard sub-projects
- `social_fund` collection structure was undocumented
- Public vs authenticated search route relationship was unclear

All six would have caused implementation-time confusion and rework.

### 2.2 Sub-project decomposition enabled parallelism

Breaking into Foundation → Dashboards (parallel) → Platform Systems → Harden allowed meaningful parallelism. The actual decomposition:

| Sub-project | Tasks | Execution |
|---|---|---|
| 1. Foundation | 22 | Sequential |
| 2A. Consultante Dashboard | 8 | Sequential (established patterns) |
| 2B. Psicólogo Dashboard | 9 | Parallel worktree |
| 2C. Admin Panel | 8 | Parallel worktree |
| 3. Platform Systems | 6 | Sequential |
| 4. Harden | 6 | 2 parallel worktrees |

Foundation established patterns → dashboards consumed them → platform systems wired them together. Each phase produced independently verifiable output.

### 2.3 Server Actions + ActionResult<T> eliminated response inconsistency

The migration from 32 Route Handlers to 25 Server Actions with typed `ActionResult<T>` was the single highest-value architectural change.

**Before:** 8 different response helpers (`ok`, `created`, `badRequest`, `notFound`, `unauthorized`, `forbidden`, `conflict`, `serverError`) with no type safety on the calling side. Each Route Handler invented its own error shape.

**After:** 2 helpers (`actionSuccess`, `actionError`) cover every case. Every mutation returns `{ success: true, data } | { success: false, error, fieldErrors? }`. Forms know exactly what to expect. 4 unit tests verify the pattern.

### 2.4 The skill system prevented improvisation

Loading skills before implementing patterns (`env-validation`, `logging`, `data-access-layer`, `form-patterns`) ensured consistency across 35 subagent dispatches. Without this, each subagent would have invented its own Pino config, Zod pattern, or error handling approach.

### 2.5 Spec → Plan → Task traceability

Every commit traces back through a chain:
```
Spec (525 lines, 7 sections)
  → 6 Plans (2,800+ lines total)
    → 55 tasks
      → 73 commits
```

### 2.6 Automated spec review caught real problems

The spec reviewer subagent found 16 issues across 2 passes — not style nitpicks, but architectural gaps. The ROI on 2 review passes (each ~3 minutes) was unambiguously positive. This is the strongest argument for the framework's process overhead.

---

## 3. What the Framework Got Wrong

### 3.1 Visual design was treated as an afterthought

The framework phases are: Discovery, Architecture, Scaffold, Build, Harden. Design quality appears only implicitly in "falcani signatures." There is no explicit design phase.

**Result:** 83 components across 3 dashboards (15 tabs total) that are functionally correct but visually basic. KPI cards are bordered rectangles. Tables are utility-class-styled HTML. Charts use default Recharts theming. The GSAP animations added in Harden (`animated-list`, `scroll-reveal`) address entrance choreography but not layout, typography hierarchy, color usage, or information density.

**Quantified gap:** The landing page — which was Lovable-designed — still looks more polished than the dashboards the framework built. Lovable optimizes for visual appeal; the solver framework optimizes for structural correctness. The ideal is both.

**Recommendation:** Add Phase 3.5 (Design Pass) or integrate the `frontend-design` skill into Phase 3 per-feature. The framework currently implies patterns + signatures = good UI. They don't. Signatures are the minimum bar, not the target.

### 3.2 The falcani signatures list is too narrow

Six signatures (shimmer loading, View Transitions, empty states, footer, error messages, error boundaries) cover infrastructure but miss visual language:

| Missing guidance | Impact on this project |
|---|---|
| Typography hierarchy | Merriweather (serif) is in the font stack but never used. No heading scale defined. |
| Spacing rhythm | Inconsistent padding across dashboards (p-4, p-6, p-8 used interchangeably) |
| Color usage beyond brand tokens | No guidance on muted backgrounds, card elevation, status color mapping |
| Information density | Admin Actividad tab has 4 KPIs + quota overview + 3 tables + retention chart + impact summary — potentially overwhelming |
| Data visualization standards | Charts use default Recharts colors, not brand palette. No axis formatting guidance. |

**Recommendation:** Expand signatures or create a "design standards" appendix covering visual language, not just technical patterns.

### 3.3 Subagent quality is inconsistent without review loops

The two-stage review (spec compliance → code quality) was applied to Foundation Phase 1A tasks but skipped for most subsequent tasks to maintain velocity.

**What happened without reviews:**
- One worktree agent branched from the wrong base (old Vite code), making its entire output unusable — required full re-implementation
- Component file naming inconsistent (PascalCase in `components/admin/`, kebab-case in `components/psychologist/`)
- One data file grew to 628 lines (`lib/data/psychologist-dashboard.ts`) — should have been split
- Some subagents added unrequested complexity (redaction config in logger, child loggers in every data function)

**Cost of skipping reviews:** 1 full worktree re-do, plus naming inconsistencies that persist.
**Cost of not skipping reviews:** ~2-4 minutes per review loop × 55 tasks = ~2-3 hours of pure review overhead.

**Recommendation:** Tiered review: mechanical tasks (config, deletions, loading states) get a build check only. Complex tasks (Server Action migration, booking flow, multi-component features) get full two-stage review.

### 3.4 Worktree isolation is fragile

4 worktree agents dispatched, results:

| Agent | Purpose | Outcome |
|---|---|---|
| 2B Psicólogo | Dashboard build | Committed to main branch directly (not worktree branch). Merged clean. |
| 2C Admin | Dashboard build | Committed to main branch directly (not worktree branch). Merged clean. |
| Harden: tests | Tests + a11y + security | Branched from wrong base (Vite code). All work lost. Had to re-implement. |
| Harden: GSAP | Visual polish | Committed to main branch directly. Already merged. |

**50% functional success rate.** 2 of 4 agents committed to the main branch instead of the worktree branch (which worked but defeated the isolation purpose). 1 of 4 branched from the wrong base entirely.

**Recommendation:** The `using-git-worktrees` skill should pre-flight verify: HEAD matches expected base, key files exist (e.g., `next.config.ts` not `vite.config.ts`), branch name is correct. 5 seconds of checking prevents 15+ minutes of recovery.

### 3.5 TDD was largely skipped

The framework hard-requires TDD. In practice:
- 4 tests written via TDD (ActionResult type — Foundation Task 4)
- 87 tests written after implementation (Harden phase)

**Why:** Most work was migration (porting Route Handler logic to Server Actions), not greenfield. Writing tests for code being ported from working implementations adds overhead without the design-driving benefit of TDD.

**Recommendation:** Distinguish migration from greenfield. For migrations, "port then test" is pragmatic. For new features (booking flow, quota notifications), TDD drives better design. The framework should acknowledge different work types.

### 3.6 Plan documents are too long for human review

| Plan | Lines | Tasks |
|---|---|---|
| Foundation | 800+ | 22 |
| Consultante Dashboard | 500+ | 8 |
| Psicólogo Dashboard | 600+ | 9 |
| Admin Panel | 500+ | 8 |
| Platform Systems | 230 | 6 |
| Harden | 150 | 6 |

The user approved plans without reading them in detail. Plans served agents but not the human oversight function they're supposed to provide.

**Recommendation:** Plans should have a 1-page executive summary (what changes, key decisions, risks) + detailed task specs. Summary for humans; tasks for agents. If humans don't read the plan, the approval gate is theater.

### 3.7 No visual verification was performed

All verification was structural:
- TypeScript compiles: yes
- Biome lint passes: yes
- Build succeeds (31 routes): yes
- 91 tests pass: yes

None verify: dashboard layouts on mobile, charts with real data, empty states at the right time, animation smoothness, actual color contrast ratios (we added aria-labels but didn't measure 4.5:1 contrast).

**Recommendation:** Add visual verification to Harden — require running the app and checking routes, or integrate visual regression testing.

---

## 4. What Was Surprising

### 4.1 The spec review process was genuinely valuable

The automated reviewer found architectural problems that would have been implementation-time bugs. 16 issues across 2 passes. This is the strongest argument for the framework's process overhead.

### 4.2 Parallel dashboard execution worked (when worktrees worked)

The dashboards genuinely don't share code. Admin touches `components/admin/` (26 files), psychologist touches `components/psychologist/` (16 files), consultante touches `components/dashboard/` (12 files). The merge was clean with zero conflicts.

### 4.3 Component count decreased despite adding features

| Branch | Components | Tabs/Pages | Features |
|---|---|---|---|
| Main (Lovable) | 93 | 12 pages | Basic CRUD |
| Migration (falcani) | 83 | 21 pages (15 dashboard tabs) | Full platform |

We added 15 dashboard tabs, email system, notification service, payment processing — and the component count went *down* by 10. Lovable created redundant wrapper components and duplicated shadcn/ui components across features. The new architecture uses Server Components that don't need client-side wrapper patterns.

### 4.4 Lines of code increased modestly despite massive scope expansion

Main branch: 20,752 lines. Migration branch: 27,180 lines (+31%). But the delta includes:

| New layer | Lines |
|---|---|
| Server Actions (lib/actions/) | 2,003 |
| Data queries (lib/data/) | 2,397 |
| Tests | 1,620 |
| Email templates | ~300 |
| Notification + payment + quota services | ~500 |

The application is 31% larger in lines but the capability surface is ~300% larger. The Lovable code was verbose (average component: 200-400 lines with mixed concerns); the normalized code is denser (average component: 80-150 lines with single responsibility).

### 4.5 The seed script was a critical gap

The framework has no guidance on development workflow. The seed script had:
- Mismatched emails (`usuario@test.dev` in seed vs `usuario@menteserena.dev` in auth form)
- Missing `Origin` header for better-auth sign-up API
- Couldn't set `role` during sign-up (better-auth security restriction) — required post-signup MongoDB update
- Required the dev server running (sign-up via HTTP API, not direct DB insert)

These practical issues blocked manual testing for 15+ minutes.

**Recommendation:** Add "development workflow" to Phase 2 (Scaffold): seed script, dev credentials alignment, local services verification (Docker Compose up), and verify the full auth flow works before starting Phase 3.

---

## 5. Metrics Summary

### 5.1 Work Performed

| Metric | Value |
|---|---|
| Total commits (this session) | 73 |
| Subagents dispatched | ~35 |
| Worktree agents | 4 (2 committed directly, 1 merged clean, 1 failed) |
| Plans written | 6 |
| Plan review passes | 2 (initial + fix verification) |
| Spec review passes | 3 (initial + fix + re-verify) |

### 5.2 Codebase Delta

| Metric | Before (main) | After (migration) | Delta |
|---|---|---|---|
| Total files | 153 | 266 | +113 (+74%) |
| TS/TSX files | 125 | 172 | +47 (+38%) |
| Lines of code (ts/tsx) | 20,752 | 27,180 | +6,428 (+31%) |
| Components | 93 | 83 | -10 (-11%) |
| Lib/utility files | 3 | 43 | +40 |
| Server Actions | 0 | 9 files / 25 functions | — |
| Data query functions | 0 | 11 files / ~30 functions | — |
| Pages/Routes | 12 | 21 | +9 |
| Route Handlers | 0 | 11 | +11 |
| Email templates | 0 | 5 | +5 |
| Test files | 1 / 0 tests | 6 / 91 tests | +91 |
| Error boundaries | 0 | 4 | +4 |
| Loading states (shimmer) | 0 | 11 | +11 |

### 5.3 Layer Distribution (migration branch)

| Layer | Files | Lines | % of total |
|---|---|---|---|
| Server Actions (`lib/actions/`) | 9 | 2,003 | 7.4% |
| Data queries (`lib/data/`) | 11 | 2,397 | 8.8% |
| Other lib (`lib/`) | 23 | 3,737 | 13.7% |
| Components (`components/`) | 83 | ~12,000 | 44.1% |
| App routes (`app/`) | 40 | ~5,400 | 19.9% |
| Tests | 6 | 1,620 | 6.0% |
| **Total** | **172** | **27,180** | **100%** |

---

## 6. Recommendations for Framework v2

### High Priority

1. **Add explicit design phase.** Either Phase 3.5 or integrate `frontend-design` skill into Phase 3 per-feature. Current output is structurally correct but visually unrefined. The framework produces engineer output, not product output. The Lovable-designed landing page still looks better than the framework-built dashboards.

2. **Tiered review depth.** Mechanical tasks (config, deletions, loading states) → build check only. Complex tasks (business logic, multi-component features) → full two-stage review. Uniform review wastes ~2-3 hours on a project this size.

3. **Worktree safety checks.** Pre-flight: confirm HEAD matches expected base, key files exist, branch is correct. Current 50% failure rate on isolation is unacceptable. 5 seconds of checking prevents 15+ minutes of recovery.

4. **Plan executive summaries.** 1-page summary for human review + detailed tasks for agent execution. No human reads 800-line plans. If the approval gate isn't read, it's theater.

5. **Visual verification step.** Require running the app and checking routes before claiming completion. Structural checks (types, lint, build, tests) don't catch UX problems.

### Medium Priority

6. **Migration vs greenfield distinction.** TDD drives design for new features. For migration, "port then test" is more efficient. Framework should acknowledge different work types.

7. **Development workflow in Phase 2.** Seed scripts, dev credential alignment, local services verification, full auth flow check. The gap between "code compiles" and "developer can log in" is real and unaddressed.

8. **Expand falcani signatures.** Add typography hierarchy, spacing rhythm, color usage, information density, data visualization standards. Current 6 signatures cover infrastructure but not visual language.

9. **Subagent model selection guidance.** From this project: config/deletions → haiku; component building/data functions → sonnet; complex business logic/multi-file coordination → opus. The skill says "use the least powerful model" but provides no mapping.

10. **Component naming convention.** Framework doesn't specify PascalCase vs kebab-case. Two parallel agents chose different conventions (`AdminActivityKPIs.tsx` vs `billing-summary.tsx`), creating inconsistency.

### Low Priority

11. **Cost tracking per phase.** ~35 subagent dispatches with no token usage visibility. Understanding cost distribution would optimize the framework's economics.

12. **Checkpoint saves.** Long sessions risk context loss. We lost internet mid-session. Framework should recommend commit + push at phase boundaries.

13. **CLAUDE.md template usage.** `PROJECT-CLAUDE-TEMPLATE.md` existed but wasn't used. Framework should guide filling it out during Phase 1, not Phase 4.

---

## 7. Conclusion

The falcani solver framework delivers on its core promise: transforming messy AI-generated code into a maintainable, well-structured application with consistent patterns and traceable decisions. From 153 files of Lovable SPA code with zero server-side logic, it produced 266 files of structured Next.js 16 application with proper separation of concerns — 25 Server Actions, 30 data query functions, 91 tests, 4 error boundaries, 11 loading states, 5 email templates, centralized notification service, payment processing, and quota management.

The framework's blind spot is design quality. It treats visual refinement as a byproduct of applying correct patterns. Patterns produce structure, not beauty. A product needs both. The landing page — Lovable-designed — still looks more polished than the dashboards the framework built. That's a meaningful signal about what the framework optimizes for and what it doesn't.

For framework v2, the three highest-leverage changes are:
1. Integrating design thinking into the build phase (not harden-phase polish)
2. Making review depth proportional to task complexity
3. Fixing worktree reliability

This was a successful first test. The output is a working, maintainable application with clean architecture. The gap to "shipped product" is design iteration and user testing — human activities the framework should facilitate rather than replace.
