# falcani solver framework — design decisions

> This document captures the reasoning behind every major decision in the solver framework. It was produced from the original brainstorm conversation between Luis (founder) and Claude, plus four rounds of real-world testing. Any solver modifying this framework should read this first to understand WHY things are the way they are, not just WHAT they are.

---

## origin story

falcani wanted a "master prompt" to help Claude Code build production applications. Through the brainstorm, we discovered the real need was much bigger: falcani had no established engineering patterns. The prompt couldn't enforce standards that didn't exist yet. So the project became two things: (1) define falcani's engineering standards, and (2) encode them into a Claude Code configuration system.

The key insight: **the prompt is only as good as the decisions it encodes.** A prompt that says "write good code" is useless. A prompt that says "every Server Action returns ActionResult<T> with discriminated unions using never types" produces consistent code.

---

## why this architecture (CLAUDE.md + skills + hooks)

### what we considered
- Single large CLAUDE.md with everything
- System prompt via API configuration
- Multiple CLAUDE.md files per subdirectory
- External documentation referenced by the agent

### what we chose and why
A three-layer system:

**CLAUDE.md (89 lines)** — universal identity, workflow, hard rules, and skill reference table. This loads on every session. Kept under 200 lines because research showed frontier LLMs reliably follow ~150-200 distinct instructions, and Claude Code's built-in system prompt already consumes ~50 of that budget. Every line must earn its place.

**Skills (.claude/skills/)** — domain-specific patterns that load on demand. This is "progressive disclosure" — the agent only gets the form-patterns skill when building forms, not when setting up CI/CD. This prevents context budget bloat. Skills have YAML frontmatter so Claude Code can register them and auto-load when relevant.

**Hooks (.claude/hooks/ + settings.json)** — deterministic enforcement. CLAUDE.md instructions are advisory (the agent may decide a rule doesn't apply). Hooks execute unconditionally. Biome runs on every file write. Type checking runs on every task completion. These are non-negotiable gates.

### why not a single large file
Research showed CLAUDE.md files over 300 lines cause measurable instruction degradation. The community consensus from experienced users is 60-200 lines for the core file. Our skills contain hundreds of lines of templates and examples that would blow this budget if inlined.

### the skill loading problem
During testing, we discovered skills weren't loading reliably. Root cause: SKILL.md files had no YAML frontmatter, so Claude Code couldn't register them in its system prompt. Additionally, skill auto-discovery from ~/.claude/skills/ is a known bug in Claude Code (multiple GitHub issues filed). We implemented three layers of redundancy:
1. YAML frontmatter on every skill (fixes registration)
2. Skill reference table in CLAUDE.md (deterministic — agent reads it directly)
3. SessionStart hook that injects skill inventory into context (backup)

---

## stack decisions — why each choice

### next.js 16 fullstack (default) vs vite + react (exception)

**Initial assumption:** Luis described the stack as "React + Node/Express." Through questioning, we discovered the actual stack was Next.js fullstack — API routes and Server Actions as the backend, not a separate Express server. This changed the entire prompt architecture.

**The Vite exception** was added later when Luis pointed out that not every project needs SSR. Internal tools and admin panels are purely client-side. The decision rule: "Public-facing or internal-only?" in Phase 0 determines the framework.

### mongodb + native driver (no ORM)

Luis was firm: no ORMs. They add vendor lock-in. But we identified a risk: without any abstraction layer, agents write inconsistent queries across a 15-40 screen application. The compromise: a **thin data access layer pattern** — per-collection service files that wrap MongoDB calls, validate with Zod, log with Pino, and standardize error handling. Not an ORM, but discipline.

### better-auth (not Auth.js, not Clerk, not custom JWT)

better-auth is TypeScript-first, framework-agnostic, has a native MongoDB adapter, supports plugins for 2FA/multi-tenant/passkeys, is YC-backed, and provides an llms.txt file for AI agent integration. It aligns with falcani's anti-vendor-lock-in stance because it's self-hosted. The alternatives were rejected: Auth.js has a more complex API, Clerk is a third-party service (vendor lock-in), and custom JWT is reinventing the wheel.

### tanstack query (not SWR) + valtio (not zustand)

Luis liked both SWR and TanStack Query. We forced a single choice because agents guess differently every time. TanStack Query won on features: mutations, infinite queries, prefetching, devtools, better TypeScript inference.

Valtio was chosen over Zustand for its proxy-based mutable API — simpler to write, lower cognitive load. In a Next.js fullstack app with TanStack Query handling server state, client state needs are minimal (theme, UI toggles), so Valtio's smaller ecosystem doesn't matter.

### biome (not eslint + prettier)

Single tool replaces both linting and formatting. Faster, fewer config files, aligns with radical simplification. Enforced via hooks, not suggestions in CLAUDE.md.

### pino (not winston, not console.log)

Pino is the fastest Node.js logger. JSON output in production, pretty in development. During testing, Pino proved its value in under 10 minutes — a 403 error from Web3Forms was immediately visible in structured logs, while without logging it would have been a silent failure.

### gsap (not framer motion)

Luis's preference, confirmed by research. GSAP is now 100% free (Webflow acquisition), covers everything Framer Motion does with better performance, and has the @gsap/react package with useGSAP() for proper cleanup. Three-tier animation standard: CSS/Tailwind for trivials, View Transitions API for route transitions, GSAP for everything complex.

### pnpm (not npm, not yarn, not bun)

pnpm's strict dependency isolation prevents phantom dependencies. Human-readable lockfile for code review. Disk efficiency across many client projects. Bun is faster at installs but lacks security auditing and has a binary lockfile. The build phase dominates total CI time anyway, making install speed less important.

### mermaid (not D2, not PlantUML)

Mermaid renders natively on GitHub, LLMs generate it with the highest accuracy (largest training corpus), and Claude Code has existing Mermaid validation skills. D2 is prettier but requires CLI compilation. PlantUML needs Java. For a framework where agents generate diagrams, native rendering and generation accuracy matter most.

### flagsmith (not custom, not LaunchDarkly)

Open source, self-hosted, free with no usage limits. Aligns with anti-vendor-lock-in. The cloud free tier is limited (50k requests, 1 user), but self-hosted has zero restrictions.

---

## workflow decisions — why phases and gates

### the aerospace pattern

Luis's background is aeronautical engineering. The phased workflow with gates (requirements → design review → build → test) comes directly from aerospace development processes. The phases exist because: without gates, an agent makes an architectural decision in file 3, builds 30 more files on top of it, and by the time you review, the rework is massive. Gates catch cascading decisions early.

### phase 0 — why discovery before architecture

Initially, the workflow started at architecture. Through brainstorming, we identified that the agent needs to ask questions before designing anything. Things like i18n, auth requirements, and third-party integrations change the architecture fundamentally. If the agent assumes, it guesses wrong.

The critical addition: "What does the user's actual daily work look like?" This question was added because Luis wanted agents to think beyond dashboards. The right UX shape might be a workflow builder (like n8n), an infinite canvas (like Figma), a Kanban board, or a conversational interface. The product vision skill forces the agent to justify its experience shape choice.

### phase 3 — signatures as requirements

Initially, falcani signatures (shimmer skeletons, transitions, empty states, footer badge, error messages) were treated as polish. Luis decided they're requirements built alongside features. The agent uses judgment: a dashboard page gets all signatures, a utility library gets none.

### best-of-N pattern

For ambiguous UX decisions, the agent produces 2-3 alternative approaches instead of committing to one. AI labor is cheap — exploring options costs less than committing to the wrong approach. This applies in Phase 1 (experience shapes) and Phase 3 (UX-critical features). It does NOT apply to straightforward features — the agent builds once, builds right.

---

## testing failures and what they taught us

### audit run 1 — mechanical compliance
**Problem:** The agent checked every standard against a static marketing site without questioning whether each standard applied. It flagged "missing Pino logger" on a site with no server-side logic.
**Fix:** Added "Apply standards contextually" to CLAUDE.md. The agent must say when a standard doesn't apply and why.

### audit run 2 — M1/S1 contradiction
**Problem:** The agent simultaneously said "all pages are SSG (correct)" and "missing loading.tsx on all pages." These contradict: SSG pages are pre-built HTML, loading.tsx never renders on them.
**Fix:** Qualified the signatures section: "loading.tsx — only for routes that fetch data at request time. Static/SSG pages should not have them." Added rendering strategy decision tree to the nextjs-routing skill.

### audit run 3 — correct but missing depth
**Problem:** The agent correctly identified findings with severity levels and contextual filtering, but didn't challenge the contact form's direct POST to Web3Forms. It accepted the existing pattern without questioning whether a Server Action wrapper would be better.
**Fix:** Expanded self-challenging instructions to cover existing codebases: "question whether the current approach is the best one."

### execution run — three violations
**Problem:** During migration execution, the agent: (1) invented its own ActionResult type instead of reading the form-patterns skill, (2) made an env var optional without asking (silent design decision), (3) blew through all 5 phases without checking in.
**Fixes:**
- Added to Phase 3: "If you encounter a decision that changes system behavior, stop and ask — don't decide silently."
- Added to Phase 3: "Load the relevant skill before implementing any pattern it covers."
- Added skill reference table to CLAUDE.md so the agent knows which skill to load for each task.
- Added YAML frontmatter to all skills (root cause of skill loading failures).

### web3forms 403 — cloudflare bot protection
**Problem:** After migrating the contact form to a Server Action, Web3Forms returned 403. The response body was a Cloudflare challenge page — it was blocking server-side requests that looked like bots.
**Decision:** Dropped Web3Forms entirely. Moved to React Email + Nodemailer — a custom solution with no third-party dependency. This aligned with falcani's anti-vendor-lock-in stance and gave full control over email delivery.
**Lesson:** When migrating client-side API calls to server-side, third-party services designed for browser requests may reject server requests. The agent should anticipate this during migration planning.

### skill loading failures
**Problem:** Skills weren't being loaded during execution even though they were installed correctly. The agent would build forms without loading form-patterns, set up env vars without loading env-validation.
**Root cause:** SKILL.md files had no YAML frontmatter. Claude Code uses frontmatter to register skills in its system prompt. Without it, the agent didn't know the skills existed.
**Fix:** Three-layer redundancy: frontmatter on all skills, reference table in CLAUDE.md, SessionStart hook as backup. Also set SLASH_COMMAND_TOOL_CHAR_BUDGET=30000 in shell profile for extra headroom.

---

## decisions we debated and why the winner won

### "falcanized by falcani.com" on falcani's own site
**Debate:** Should the footer badge appear on falcani.com itself, or only on client products?
**Decision:** Yes, it appears everywhere. falcani's own products ARE falcani products. The badge says "we eat our own cooking" and creates another touchpoint for the #falcanize verb. Every surface counts for brand propagation.

### monorepo vs single project
**Initial answer:** "Depends on the project." This was challenged as a non-decision. The agreed standard: Next.js fullstack as a single project is the default. Separate backend (monorepo) only when the project requires heavy background processing, real-time websockets, or microservice architecture. That's an opinion with a clear exception trigger, not a "depends."

### REST vs GraphQL
**Initial challenge:** Luis argued that since AI agents already understand GraphQL, the learning curve argument doesn't apply. Correct — but the maintenance argument still stands. When the project is done, someone at the client's company maintains it. That person is a junior-to-mid developer, not an AI agent. REST with strict conventions is universally understood.
**Decision:** REST as default, GraphQL only when complex data relationships across many views would cause endpoint sprawl. A clear exception trigger.

### response envelope for Server Actions
**Initial position:** "Server Actions don't need an envelope — they're type-safe function returns."
**Correction:** Without a consistent shape, every action returns something different and the frontend has to guess how to handle results. HTTP endpoints have status codes; Server Actions have nothing. The ActionResult<T> discriminated union with never types was designed to give TypeScript narrowing and consistent error handling across every action in every project.

### how aggressively to challenge existing code during audits
**Options:** Only security/performance/reliability, also UX/architecture, or challenge everything.
**Decision:** Challenge everything but flag severity clearly. Four levels: Critical (broken/insecure), High (wrong pattern with consequences), Moderate (suboptimal but functional), Suggestion (could be better). Each finding also labeled as: standard violation, missing standard, better pattern exists, or not applicable.

---

## the "falcani signature" — behavioral, not visual

### what we rejected
A rigid "falcani design system" with locked colors, typography, and component styles. This was wrong because falcani is a custom software factory — clients get their own visual identity. A tailor makes the client look good; the quality of the stitching is what tells you who made it.

### what we chose
The falcani signature lives in UX behavior patterns, not visual identity:
1. **Shimmer skeleton loading** — specific timing, specific colors (#f2f2f2 base, #30c9e8 shimmer), only on routes that fetch at request time
2. **View Transitions easing curve** — consistent across all navigations
3. **Empty states** — text-forward, human language, clear action, no sad faces or illustrations
4. **Footer badge** — "falcanized by falcani.com" with link
5. **Error messages** — specific and human, never generic
6. **Error boundaries** — error.tsx at app root minimum

The client owns the look. falcani owns the feel and the craftsmanship.

---

## what's not built yet (intentionally)

These skills are on the roadmap but were not built because no real project demanded them yet. **Build each only when a project needs it — not from imagination.**

- auth-setup (better-auth configuration patterns)
- docker (Dockerfile + docker-compose templates)
- feature-flags (Flagsmith integration)
- caching (Redis + Next.js cache patterns)
- i18n (next-intl setup)
- testing (Vitest configuration and patterns)
- realtime (SSE / WebSocket patterns)
- webhooks (signature verification, idempotent processing)
- background-jobs (BullMQ setup)
- image-handling (file uploads to S3/R2)
- monitoring (health check endpoint, OpenTelemetry)
- email-templates (React Email + Nodemailer — partially implemented during www.falcani.com migration)

---

## how to improve this framework

The framework evolves through contact with reality, not through imagination:

1. Test on a real project
2. Note where the agent deviates from expectations
3. Identify whether the gap is in the CLAUDE.md, a skill, a hook, or missing entirely
4. Make the smallest change that fixes the gap
5. Test again on the same project to verify
6. Test on a different project to confirm the fix generalizes

Every improvement in this framework came from a real failure during testing. None came from theorizing about what might go wrong.

---

*this document was created from a brainstorm conversation that spanned initial design, four audit iterations, one full migration execution, three framework corrections, and a skill loading system redesign. the conversation is archived but this document captures the reasoning that matters for future modifications.*
