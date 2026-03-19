#!/usr/bin/env bash
# Injected at session start — reminds the agent which skills are available.
# This is a backup mechanism. The CLAUDE.md skills table is the primary reference.

cat << 'EOF'
{
  "additionalContext": "FALCANI SKILLS AVAILABLE — load the relevant skill before implementing any pattern it covers:\n- form-patterns: forms, Server Actions, ActionResult, Zod validation, react-hook-form, DevFormFiller\n- env-validation: lib/env.ts, .env.example, Zod env schema, process.env\n- logging: Pino setup, log levels, structured logging, request context\n- nextjs-routing: App Router, routes, pages, layouts, loading.tsx, error.tsx, rendering strategy (SSG/SSR/ISR/streaming)\n- data-access-layer: MongoDB services, collections, queries, indexes, Zod validation\n- audit: codebase audit, compliance check, migration plan\n- ci-cd: GitHub Actions, deployment pipelines, quality gates\n- product-vision: Phase 0 discovery, PRODUCT-VISION.md, experience shape"
}
EOF
