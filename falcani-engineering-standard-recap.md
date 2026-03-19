# falcani engineering standard — complete decision recap

> This document captures every engineering decision made during the brainstorm session between Luis (founder, falcani) and Claude. It serves as the source of truth for building the CLAUDE.md master prompt system. Every line here has been discussed, challenged, and agreed upon.

---

## identity & purpose

This is a CLAUDE.md system for Claude Code that turns the agent into a falcani solver. It operates in two modes: **architecture mode** (with Luis, system-level decisions) and **implementation mode** (for agents, building features). The agent produces architecture documents, diagrams, scaffolding, and production code.

The prompt is structured as a hierarchy: global CLAUDE.md (universal standards), project-level CLAUDE.md (project-specific context), subdirectory CLAUDE.md files (lazy-loaded), skills (progressive disclosure), and hooks (deterministic enforcement).

---

## phased workflow with gates

### phase 0 — discovery
The agent asks structured questions before anything else. Minimum discovery checklist:
- Does the app need multiple languages (i18n)?
- Client brand: colors, fonts, logo, design tokens?
- Auth requirements: email/password, OAuth providers, 2FA, multi-tenant?
- External API consumers: mobile apps, third parties, partner integrations?
- Third-party integrations: payment, CRM, email, analytics?
- Offline requirements?
- Expected scale: users, data volume?
- Existing data to migrate?
- Feature flag requirements: gradual rollouts needed?
- Real-time features: live dashboards, notifications, collaborative editing?

Agent collects answers, then proceeds to Phase 1 with real context.

### phase 1 — architecture (wait for approval)
Agent produces: system overview, data model, API routes/Server Actions mapping, Mermaid diagrams, tech decisions document. **Stops and waits for approval.**

### phase 2 — scaffold (wait for approval)
Agent scaffolds project structure based on approved architecture. **Stops and waits for approval.**

### phase 3 — build (check-ins per feature)
Agent builds feature by feature, with check-ins per feature: what was built, what decisions were made, what to review.

### phase 4 — hardening
Security review, performance optimization, accessibility audit, production readiness checks.

---

## core stack

| decision | standard | exception trigger |
|----------|----------|-------------------|
| framework | Next.js 16 fullstack | separate Node/Express backend only for heavy background processing, real-time websockets, or microservice architecture |
| language | TypeScript everywhere, strict mode | never |
| database | MongoDB + native Node.js driver (no ORM) | PostgreSQL when data is highly relational or transaction-heavy |
| auth | better-auth (with MongoDB adapter) | never — always use better-auth |
| server state | TanStack Query | never |
| client state | Valtio (minimal — UI toggles, theme, ephemeral state) | never |
| styling | Tailwind CSS | never |
| UI components | shadcn/ui (owned, full flexibility per client) | never |
| forms | react-hook-form + Zod (@hookform/resolvers) | never |
| validation | Zod (single schema for client + server validation) | never |
| lint & format | Biome (enforced via hooks, not suggestions) | never |
| testing | Vitest — tests required for critical business logic and API endpoints, full coverage optional per project | never |
| diagrams | Mermaid (renders natively on GitHub) | Structurizr DSL for formal C4 architecture models |
| logging | Pino + pino-pretty (dev only) | never |
| package manager | pnpm | never npm, never yarn. bun acceptable only if project explicitly requires it |
| feature flags | Flagsmith (open source, self-hosted, free) | simple env variable flags for trivial cases |
| email | React Email (templates) + Nodemailer (transport) | never |
| CI/CD | GitHub Actions | never |
| proxy/middleware | proxy.ts (Next.js 16 convention). NEVER middleware.ts — it is deprecated | never |

---

## api design

### server actions vs route handlers

**server actions** (default for mutations from UI):
- form submissions, data CRUD, any action triggered by a UI component
- type-safe, simpler, no fetch boilerplate
- return typed objects directly — no response envelope needed

**route handlers** (only when needed):
- webhooks from external services (Stripe, etc.)
- endpoints consumed by external clients (mobile apps, third parties)
- cacheable GET endpoints serving public data
- better-auth handler mounts
- response envelope applies: `{ data, meta? }` on success, `{ error: { code, message, details? } }` on failure
- HTTP status codes carry success/failure semantics — no `success: boolean` wrapper

### rest conventions (for route handlers)
- predictable URL patterns: `/api/[resource]` (plural nouns)
- consistent status codes: 200 (success), 201 (created), 400 (validation), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)
- consistent error shape: `{ error: { code: "VALIDATION_ERROR", message: "Email is required", details?: [...] } }`

---

## next.js 16 + react 19 features (mandatory usage)

| feature | usage |
|---------|-------|
| proxy.ts | replaces middleware.ts. use ONLY for route protection, i18n routing, header manipulation. NEVER middleware.ts |
| view transitions | enable in next.config.ts (`experimental: { viewTransition: true }`). use `<ViewTransition>` for page transitions — this IS the falcani transition signature |
| react compiler | enable `reactCompiler: true`. DO NOT manually add useMemo, useCallback, or React.memo unless profiling shows the compiler missed an optimization |
| streaming + suspense | `loading.tsx` for route-level, `<Suspense>` with falcani shimmer skeleton for component-level |
| `<Activity>` | use for tab-based UIs, multi-step forms — preserves state when switching |
| `useEffectEvent` | use to clean up useEffect dependency arrays — stable callbacks that access latest props/state |
| "use cache" + cacheLife() | opt-in caching for pages/components serving same data to multiple users |
| URL state (searchParams) | prefer over client state for filters, sort, tabs, pagination — anything shareable/bookmarkable |
| `next/image` | always for images (automatic optimization) |
| `next/font` | always for fonts (self-hosting) |
| `next/dynamic` | for heavy components not needed on initial load |
| turbopack | default bundler — no configuration needed |

---

## data access layer

No ORMs. Thin service wrappers per MongoDB collection that standardize:
- queries (find, findOne, create, update, delete)
- validation (Zod schema applied before write operations)
- error handling (consistent error objects)
- logging (Pino child logger per service)
- index definitions (explicit, documented)

Example structure: `lib/db/collections/users.ts`, `lib/db/collections/orders.ts`

---

## logging standard (pino)

### levels
| level | when to use |
|-------|------------|
| fatal | application cannot continue. process crashing. unrecoverable |
| error | something failed that should have worked. caught exceptions, API failures, rejected writes. always include error object + operation + context |
| warn | handled gracefully but worth investigating. retries, fallbacks triggered, deprecation usage, rate limits approaching |
| info | significant business events. user signup, order placed, payment processed, deployment. one per operation |
| debug | internal details for development. query times, cache hit/miss, sanitized payloads. never in production unless actively debugging |
| trace | extremely granular. function entry/exit, variable states. almost never used |

### mandatory structured fields
timestamp (auto), request ID (correlation), user ID (when authed), operation name, duration (for timed operations)

### hard rules
- never log passwords, tokens, full credit card numbers. use pino redaction
- never `console.log` in production code — treat as lint error
- pino-pretty in dev only, JSON in production

---

## falcani behavioral signatures

These UX patterns create a recognizable fingerprint across all falcani-built applications. Clients never question them because they're good UX. They're consistently the same good UX.

### loading shimmer pattern
- all loading states use a shimmer skeleton animation
- specific timing curve aligned with falcani brand (smooth, intentional, not frantic)
- implemented via Suspense fallbacks and loading.tsx files
- uses falcani's Clean White (#f2f2f2) as base with subtle Sky Cyan (#30c9e8) shimmer

### transition signature
- view transitions API with a specific cubic-bezier easing curve
- applied via `<ViewTransition>` component
- snappy, intentional, never default CSS transitions
- consistent across page navigations and modal/dialog entrances

### empty state treatment
- text-forward, no illustrations or sad faces
- clear explanation of what goes here
- prominent, specific action to fill the state
- human language from the brand guide ("No orders yet. Create your first one to see it here.")

### footer badge
- "falcanized by falcani.com" with link
- present on every client-facing application
- subtle, in the footer, matches the application's typography

---

## dev-mode form prefiller (DevFormFiller)

Every form gets a development-only tool for rapid testing:
- **valid data**: complete, correct submission for happy path
- **invalid data**: wrong formats, too-short values, missing fields — tests validation
- **empty data**: all fields blank — tests required field validation
- **edge case data**: max length, special characters, unicode, boundary values
- **realistic data**: plausible names, real-looking emails — for demos and screenshots

Implemented as a component that wraps forms in dev only (stripped from production). Test scenarios derived from the Zod schema — one source of truth.

---

## security defaults

- input validation on EVERY Server Action and Route Handler (Zod, no exceptions)
- rate limiting on all Route Handlers
- CORS configuration for external-facing Route Handlers
- security headers (CSP, HSTS, X-Frame-Options) via proxy.ts or Next.js config
- environment variables validated at startup via Zod schema in `lib/env.ts`
- never commit secrets, .env files, or node_modules
- pino redaction for sensitive data in logs
- better-auth handles session management, CSRF, token rotation

---

## environment variable management

- `.env.example` committed to repo with every required variable (keys + comments, no values)
- centralized `lib/env.ts` validates ALL env vars at startup using Zod
- no scattered `process.env.WHATEVER` — everything accessed through typed, validated exports
- agent validates env vars exist before any feature that depends on them

---

## infrastructure decision rules

| tool | when to use |
|------|-------------|
| docker + docker-compose | deploying to VPS, projects with background workers/queues/multiple services, local dev with complex dependencies |
| redis | expensive shared queries, rate limiting, session storage beyond better-auth, background job queues (BullMQ) |
| BullMQ | email sending, report generation, data imports, scheduled tasks — anything that can't run in request/response |
| flagsmith | gradual rollouts, per-user/segment features, A/B testing. self-hosted via docker-compose |

---

## deployment

| target | when |
|--------|------|
| vercel | default for standard Next.js apps |
| cloudflare | alternative to vercel when edge computing or workers are needed |
| VPS (docker) | heavy compute processing, complex infrastructure requirements |

CI/CD via GitHub Actions: biome lint/format → typecheck → vitest → build → deploy

---

## code quality & architecture principles

- single responsibility: one function does one thing, one file has one purpose
- composition over inheritance
- pure functions preferred, side effects at the edges
- repository pattern for data access (the data access layer)
- dependency injection: services receive dependencies (enables testing)
- function names that explain themselves: `reconcileInventoryWithShippingRecords` not `processData`
- README-first documentation on every project
- error messages that are specific and human: "We couldn't process your request because [reason]. Try [fix]"
- comments explain WHY, not WHAT. no `// auth check` — instead explain the reasoning
- accessibility as default: semantic HTML, keyboard navigation, alt text, labels, WCAG AA minimum
- git: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`), atomic commits, never commit secrets

---

## agent behavioral rules

1. before using any library or tool, check for an exposed `llms.txt` at the library's documentation site. if available, read it first. always prefer latest documentation over training data
2. NEVER create middleware.ts — always proxy.ts (Next.js 16)
3. NEVER use npm or yarn — always pnpm
4. NEVER use `console.log` in production code — always Pino
5. NEVER skip input validation — every Server Action and Route Handler validates with Zod
6. NEVER commit .env files or secrets
7. ALWAYS create .env.example with documented keys
8. ALWAYS run biome format + lint before completing any file (enforced via hooks)
9. ALWAYS use TypeScript strict mode
10. ALWAYS ask discovery questions (Phase 0) before producing architecture

---

## skills (progressive disclosure — loaded on demand)

| skill | contents |
|-------|----------|
| data-access-layer | MongoDB collection service template, Zod integration, index patterns |
| auth-setup | better-auth configuration with MongoDB, plugin patterns, route protection |
| email-templates | React Email + Nodemailer setup, preview app scaffold |
| form-patterns | react-hook-form + Zod + Server Action template, DevFormFiller component |
| docker | multi-stage Dockerfile, docker-compose templates, .dockerignore |
| ci-cd | GitHub Actions workflow templates per deployment target |
| feature-flags | Flagsmith integration, self-hosted setup, React hook pattern |
| logging | Pino setup template, level guidelines, structured fields, redaction |
| caching | Redis patterns, Next.js cache strategies, invalidation patterns |
| i18n | next-intl setup, translation patterns, locale routing |
| testing | Vitest configuration, test patterns per layer (unit, integration, API) |
| realtime | SSE for one-way, WebSocket for bidirectional, polling as fallback |
| webhooks | signature verification, idempotent processing, fast response pattern |
| background-jobs | BullMQ setup, job patterns, retry strategies |
| image-handling | file uploads to S3/R2, optimization, avatar handling |
| monitoring | health check endpoint, OpenTelemetry when needed |

---

## what's NOT in the prompt

- visual design system (client-defined per project)
- pricing or proposal content
- specific client business logic
- deployment credentials or secrets
- anything from brand/content/marketing documents — this prompt is purely engineering
- hiring, sales, or business operations

---

*this document is the complete record of decisions. the CLAUDE.md system files are built from this. if a decision isn't here, it wasn't agreed upon.*
