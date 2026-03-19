# [project name] — project CLAUDE.md

> Generated during Phase 1 (Architecture). This file is project-specific and lives at the repo root.

## project context

**Client:** [client name]
**Domain:** [what the business does]
**Problem:** [the specific problem this software solves]
**Users:** [who uses this system and how — roles, scale]

## brand tokens

```css
/* Client brand — applied to Tailwind config and CSS variables */
--color-primary: [client primary color];
--color-secondary: [client secondary color];
--color-accent: [client accent color];
--color-background: [client background];
--color-foreground: [client text color];
--font-primary: [client heading font];
--font-body: [client body font];
```

## architecture decisions

**i18n:** [yes/no — if yes, which locales, using next-intl]
**auth providers:** [email/password, Google, Microsoft, etc.]
**external API consumers:** [mobile app, third-party integrations, none]
**deployment target:** [Vercel / Cloudflare / VPS]
**database:** [MongoDB — or PostgreSQL if relational data justified]
**real-time:** [none / SSE / WebSocket — and for what feature]
**background jobs:** [none / BullMQ — and for what tasks]
**feature flags:** [none / Flagsmith — and for what features]
**caching:** [Next.js built-in / Redis — and for what]
**email:** [none / React Email + Nodemailer — transactional emails needed?]

## data model

```mermaid
erDiagram
    [entity relationship diagram here]
```

## api design

### server actions (mutations from UI)
- [list of server actions grouped by feature]

### route handlers (external consumers / webhooks)
- [list of route handlers with methods and purpose]

## project structure

```
[project name]/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth-related routes (grouped)
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── api/                # Route Handlers
│   │   │   ├── auth/[...all]/  # better-auth mount
│   │   │   ├── webhooks/       # External webhooks
│   │   │   └── health/         # Health check endpoint
│   │   ├── layout.tsx          # Root layout
│   │   ├── loading.tsx         # Root loading (falcani shimmer)
│   │   └── not-found.tsx       # Custom 404
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components (owned)
│   │   └── [feature]/          # Feature-specific components
│   ├── lib/
│   │   ├── auth.ts             # better-auth server config
│   │   ├── auth-client.ts      # better-auth client
│   │   ├── db/
│   │   │   ├── client.ts       # MongoDB connection
│   │   │   └── collections/    # Data access layer per collection
│   │   ├── env.ts              # Zod-validated environment variables
│   │   ├── logger.ts           # Pino logger setup
│   │   └── utils.ts            # Shared utilities
│   ├── actions/                # Server Actions grouped by domain
│   ├── hooks/                  # Custom React hooks
│   ├── stores/                 # Valtio stores (minimal)
│   ├── types/                  # Shared TypeScript types
│   └── emails/                 # React Email templates (if applicable)
├── public/                     # Static assets
├── tests/                      # Vitest test files
├── .github/workflows/          # GitHub Actions CI/CD
├── proxy.ts                    # Next.js 16 proxy (NOT middleware.ts)
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind + client brand tokens
├── biome.json                  # Biome lint + format config
├── .env.example                # Documented env var keys (no values)
├── CLAUDE.md                   # This file
└── package.json                # pnpm
```

## feature list

| feature | status | priority | notes |
|---------|--------|----------|-------|
| [feature 1] | planned | critical | [notes] |
| [feature 2] | planned | high | [notes] |

## key domain terms

| term | meaning |
|------|---------|
| [domain term] | [what it means in this client's business] |
