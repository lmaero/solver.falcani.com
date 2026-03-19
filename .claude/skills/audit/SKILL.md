---
name: audit
description: "Audit existing codebases against falcani standards. Use when asked to review, audit, check compliance, assess code quality, or evaluate an existing project."
---

# skill: audit

## purpose
Structured workflow for auditing existing codebases against falcani standards. Determines intent before auditing, applies findings with clear severity, and challenges existing decisions — not just compliance.

## step 1: determine intent

Before starting any audit, ask the user what they're trying to accomplish. Present these options but accept custom answers:

1. **Modernize to falcani standards** — full audit, all findings, prioritized by effort-to-value
2. **Prepare for new features** — focus on architectural foundation and gaps that block feature work
3. **Fix something specific** — skip full audit, focus on the reported problem and dependencies
4. **Prepare for client handoff** — focus on documentation, code clarity, maintainability, error handling
5. **Brand polish** — focus on signatures, transitions, loading states, error messages, visual consistency
6. **Custom** — describe the goal

The intent filters which findings to surface and how to prioritize them. A "brand polish" audit doesn't need to flag missing Zod validation. A "fix something specific" audit doesn't need to evaluate rendering strategies on unrelated pages.

## step 2: audit with severity

Every finding uses one of four severity levels:

### critical
Actively broken or insecure. Must fix before shipping.
- Missing input validation on public-facing forms
- Exposed secrets or credentials
- No error boundaries on pages that can crash
- Security headers missing on production routes
- Auth checks bypassed or absent

### high
Wrong pattern with real consequences. Fix soon.
- useEffect instead of useGSAP causing memory leaks
- SSR where SSG would eliminate unnecessary server load
- Missing auth on protected routes
- No env validation (app silently breaks on missing config)
- Client-side data mutations that should be Server Actions

### moderate
Suboptimal but functional. Improve when touching this code.
- Client-side POST that should be a Server Action for validation/logging
- Missing loading.tsx on a page that fetches at request time
- Missing Zod on a low-risk form
- Rendering strategy could be more efficient
- Missing error.tsx error boundaries

### suggestion
Not wrong, but could be better. Consider during next iteration.
- Code organization improvements
- Transition polish and animation refinement
- Additional empty state treatments
- Performance optimizations with no user-visible impact
- Dependency version upgrades with no breaking changes

## step 3: distinguish finding types

Each finding should be labeled as one of:

- **standard violation** — the code does something the CLAUDE.md explicitly says not to do (useEffect for GSAP, console.log, middleware.ts)
- **missing standard** — the code doesn't implement something the CLAUDE.md requires (no loading.tsx, no env validation, no footer badge)
- **better pattern exists** — the code works but a different approach would be more correct, performant, or maintainable (SSR → SSG, client POST → Server Action, no Zod → Zod)
- **not applicable** — a standard that doesn't apply to this project type, with explanation of why

## step 4: challenge existing decisions

Don't just measure compliance. For every significant pattern in the codebase, ask whether it's the right choice:

- **Rendering strategy**: is each page using the right strategy (SSG/ISR/SSR/streaming)? A page that's SSR but serves the same content to every user should be SSG. A page that's SSG but pulls from an external CMS should be ISR. Flag mismatches.
- **Data flow**: is data fetched where it should be? Client-side fetching that could be a server component. Waterfall fetches that could be parallel. Props drilling that could be a server component composition.
- **Form handling**: is client-side submission to third parties the right call, or would a Server Action wrapper add validation, rate limiting, and logging?
- **Component boundaries**: are client/server boundaries drawn in the right place? A "use client" component that only needs interactivity in a small child is pushing too much to the client.
- **Dependencies**: are there dependencies that could be eliminated? A library used for one utility function that could be a 10-line helper instead.

Label these as "better pattern exists" findings at the appropriate severity.

## step 5: output format

Structure the audit as:

1. **Compliant** — table of standards that the project already meets
2. **Non-compliant findings** — grouped by severity (critical first), each with: standard violated, current state, specific files, finding type, recommended fix
3. **Contextually not applicable** — standards that don't apply to this project type, with reasoning
4. **Proposed migration plan** — prioritized by the stated intent, with time estimates appropriate to agent execution speed (not human estimates)

## time estimates

When estimating effort, account for the fact that AI agents execute significantly faster than humans:

- Config changes: minutes, not hours
- Single component creation: 5-15 minutes
- Pattern migration across multiple files: 15-30 minutes
- New feature with tests: 30-60 minutes
- Complex architectural change: 1-2 hours

Don't use human time estimates. The user knows agents are their primary solvers.

## rules
- ALWAYS ask intent before auditing — never start a full audit without knowing the goal
- ALWAYS use the four severity levels — never present a flat list
- ALWAYS include the "contextually not applicable" section — showing what you correctly skipped is as important as what you found
- ALWAYS distinguish finding types (violation / missing / better pattern / not applicable)
- ALWAYS challenge rendering strategies — check every page for SSG/ISR/SSR/streaming fit
- ALWAYS propose a migration plan filtered through the stated intent
- NEVER flag standards as violations when they're contextually not applicable
- NEVER use human time estimates — use agent-appropriate estimates
