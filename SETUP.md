# falcani solver framework — setup instructions

## what you're installing

A CLAUDE.md system that turns Claude Code into a falcani solver. It includes a global identity file, project-level template, hooks for automated enforcement, and 7 skills for progressive disclosure.

```
falcani-claude-system/
├── CLAUDE.md                                    # Global solver identity (64 lines)
├── PROJECT-CLAUDE-TEMPLATE.md                   # Template for per-project CLAUDE.md
├── .claude/
│   ├── settings.json                            # Hooks + permissions
│   └── skills/
│       ├── ci-cd/SKILL.md                       # GitHub Actions pipeline
│       ├── data-access-layer/SKILL.md           # MongoDB service pattern
│       ├── env-validation/SKILL.md              # Zod-validated env vars
│       ├── form-patterns/SKILL.md               # react-hook-form + Zod + ActionResult + DevFormFiller
│       ├── logging/SKILL.md                     # Pino setup + level guidelines
│       ├── nextjs-routing/SKILL.md              # App Router conventions + decision tree
│       └── product-vision/SKILL.md              # Product vision document template
```

---

## option A: install globally (applies to ALL projects)

This makes every Claude Code session on your machine start as a falcani solver.

```bash
# 1. copy the global CLAUDE.md to your home directory
mkdir -p ~/.claude
cp CLAUDE.md ~/.claude/CLAUDE.md

# 2. copy the skills to your home directory
cp -r .claude/skills ~/.claude/skills
```

Settings and hooks are project-level only (they depend on the project having biome and typescript installed), so they go into each project individually — see Option B step 2.

After this, every time you run `claude` in any directory, it loads the falcani solver identity and skills automatically.

---

## option B: install into a specific project

Use this when you want the framework on one project only, or when adding to an existing repo.

```bash
# 1. from the root of your project:
cp CLAUDE.md ./CLAUDE.md

# 2. copy the .claude directory (settings + skills)
cp -r .claude ./.claude

# 3. commit to git (so other agents/solvers get it too)
git add CLAUDE.md .claude/
git commit -m "chore: add falcani solver framework"
```

---

## option C: hybrid (recommended)

Global identity + per-project settings and skills.

```bash
# global: the identity and skills load everywhere
mkdir -p ~/.claude
cp CLAUDE.md ~/.claude/CLAUDE.md
cp -r .claude/skills ~/.claude/skills

# per-project: settings/hooks that depend on project tooling
# run this in each project root:
mkdir -p .claude
cp path/to/falcani-claude-system/.claude/settings.json ./.claude/settings.json
git add .claude/settings.json
git commit -m "chore: add claude code settings with biome hooks"
```

---

## for a NEW project (starting from zero)

```bash
# 1. create the project
pnpm create next-app@latest my-project --typescript --tailwind --app --src-dir

# 2. enter the project
cd my-project

# 3. copy the framework files
cp path/to/falcani-claude-system/CLAUDE.md ./CLAUDE.md
cp -r path/to/falcani-claude-system/.claude ./.claude

# 4. rename the project template for reference
cp path/to/falcani-claude-system/PROJECT-CLAUDE-TEMPLATE.md ./docs/PROJECT-CLAUDE-TEMPLATE.md

# 5. install falcani standard dependencies
pnpm add @tanstack/react-query valtio zod react-hook-form @hookform/resolvers pino better-auth mongodb gsap @gsap/react

# 6. install dev dependencies
pnpm add -D @biomejs/biome vitest pino-pretty

# 7. initialize biome
pnpm biome init

# 8. commit the framework
git add -A
git commit -m "chore: initialize falcani solver framework"

# 9. start claude code
claude
```

Then tell Claude: "Let's start Phase 0. Here's the client problem: [describe it]."

The agent will ask discovery questions, produce `docs/PRODUCT-VISION.md`, and wait for your approval before architecture.

---

## for an EXISTING project

```bash
# 1. from the project root:
cp path/to/falcani-claude-system/CLAUDE.md ./CLAUDE.md
mkdir -p .claude/skills
cp path/to/falcani-claude-system/.claude/settings.json ./.claude/settings.json
cp -r path/to/falcani-claude-system/.claude/skills/* ./.claude/skills/

# 2. check which falcani dependencies you're missing
# required:
pnpm add zod react-hook-form @hookform/resolvers pino @tanstack/react-query valtio gsap @gsap/react
pnpm add -D @biomejs/biome vitest pino-pretty

# 3. if you don't have biome configured yet:
pnpm biome init

# 4. commit
git add CLAUDE.md .claude/
git commit -m "chore: add falcani solver framework"

# 5. start claude code
claude
```

Then tell Claude: "Read the CLAUDE.md and the existing codebase. Tell me what doesn't align with the falcani standards and propose a migration plan."

The agent will audit the project against the framework and propose incremental changes — it won't rewrite everything at once.

---

## verifying the setup works

After installing, run Claude Code and test these:

```
# test 1: does the agent know it's a falcani solver?
> "What framework standards are you following?"
# expected: it should reference the phased workflow, the stack, the hard rules

# test 2: does the agent follow Phase 0?
> "Build me a task management app"
# expected: it should NOT start coding. It should ask discovery questions first

# test 3: does the agent refuse middleware.ts?
> "Create a middleware.ts file for auth"
# expected: it should correct you and use proxy.ts instead

# test 4: does the agent use the right patterns?
> "Create a Server Action to create a user"
# expected: Zod validation, ActionResult return type, Pino logging, consistent error shape

# test 5: do hooks work?
> create any .ts file
# expected: biome auto-formats on save, typecheck runs on task completion
```

---

## updating the framework

As you test and discover gaps:

```bash
# edit the global CLAUDE.md
nano ~/.claude/CLAUDE.md

# add a new skill
mkdir -p ~/.claude/skills/new-skill
nano ~/.claude/skills/new-skill/SKILL.md

# update per-project settings
nano .claude/settings.json
```

Skills you'll likely want to add after testing:
- auth-setup (better-auth configuration patterns)
- docker (Dockerfile + docker-compose templates)
- feature-flags (Flagsmith integration)
- caching (Redis + Next.js cache patterns)
- i18n (next-intl setup)
- realtime (SSE / WebSocket patterns)
- webhooks (signature verification, idempotent processing)
- background-jobs (BullMQ setup)

Build each skill only when a real project demands it. Don't pre-build from imagination.

---

## the PROJECT-CLAUDE-TEMPLATE.md

This file is NOT used directly. It's a template that shows the agent what a per-project CLAUDE.md should look like. During Phase 1, the agent will produce a project-specific CLAUDE.md based on this structure, filled with the actual architecture decisions for that project. Keep it in `docs/` as a reference.

---

*now go falcanize something. the framework gets better by contact with reality, not by adding more skills from imagination.*
