# Solver Framework — First Real Project Report

**Project:** www.falcani.com v3 redesign
**Date:** 2026-03-19
**Duration:** Single extended session
**Branch:** `redesign/v3-narrative` (6 final commits, ~31 pre-squash)
**Operator:** Claude Opus 4.6 (1M context)

---

## Repository Context

### Codebase before this session

| Metric | Value |
|---|---|
| Total files on `main` | 246 |
| Source files (tsx/ts/css/mjs) | 53 |
| Total source lines | 5,395 |
| MDX content files | 45 (12 case studies, 32 blog articles, 1 product) |
| Team member images | 8 |
| Client logo sets | 15 |
| Project hero images (in MDX dirs) | 12 |
| Git history on `main` | 151 commits |

### Stack on `main` (before redesign)

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.7 (App Router, MDX) |
| UI | React 19.2.4 |
| Styling | Tailwind CSS 4.2.1, PostCSS |
| Animation | Framer Motion (`motion/react`) — only library |
| Fonts | Mona Sans (local variable font) |
| Linting | Biome 2.4.7 |
| Content | MDX with remark/rehype plugins, Shiki highlighting |
| Deploy | Vercel (analytics + speed insights) |
| Email | Zoho Campaigns (newsletter form in footer) |

### Stack on `redesign/v3-narrative` (after session)

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.7 (pinned, was `^16.1.7`) |
| UI | React 19.2.4 |
| Styling | Tailwind CSS 4.2.2, PostCSS |
| Animation | GSAP 3.14.2 + @gsap/react 2.1.2 (primary), Framer Motion (legacy nav) |
| Smooth scroll | Lenis 1.3.19 (desktop only) |
| Fonts | Outfit + DM Sans (Google Fonts, replacing Mona Sans) |
| New deps added | gsap, @gsap/react, lenis |
| Deps kept but shouldn't be | motion (Framer Motion) — violates CLAUDE.md |

### What changed

| Metric | main | v3-narrative | Delta |
|---|---|---|---|
| Total files | 246 | 285 | +39 |
| Source lines | 5,395 | 8,037 | +2,642 |
| New source files | — | 39 | — |
| Modified source files | — | 35 | — |
| Homepage component lines | 0 | 1,567 | +1,567 |
| Placeholder images added | 0 | 5 | +5 |
| Framework config files | 0 | 12 | +12 (.claude/, CLAUDE.md, skills/) |

### Branch history

| Branch | Purpose | Commits over main | Outcome |
|---|---|---|---|
| `redesign/v2` | First GSAP-based redesign | 8 | Abandoned — used as creative reference |
| `redesign/v3-ux-overhaul` | Spec + plan drafting branch | 10 | Abandoned — spec/plan cherry-picked |
| `redesign/v3-narrative` | Final implementation | 6 (31 pre-squash) | Current working branch |

### Previous design (main branch)

The site on `main` was a **light-themed agency template**: white backgrounds, dark text (`neutral-950`), Framer Motion layout animations, a fullscreen burger-menu navigation panel, rounded-corner content wrapper with GridPattern overlay. The design was clean but generic — it could have been any agency's site.

### Design target

Cinematic dark-theme experience inspired by Rockstar Games GTA VI: dark navy background (#061c32), cyan/sky accents, scroll-driven narrative with GSAP, integrated story where projects/stats/team are interwoven (not siloed sections), gradient text fills, outline letters, custom cursor, preloader with brand imprinting.

---

## Phased Workflow Execution

### Phase 0: Discovery — SKIPPED
The project skipped formal discovery because the user (the founder) already had a clear vision: "replicate [Rockstar VI] with our content." The brainstorming skill was used instead to refine the direction through visual options (homepage approach, page transitions, splash behavior, narrative order, media strategy). This worked well — 5 decisions were made in rapid succession through the visual companion.

**Finding:** For founder-led projects where the vision is already formed, the brainstorming skill's visual companion is more efficient than Phase 0 discovery. Consider a "fast-track" path for projects where the decision-maker has strong opinions.

### Phase 1: Architecture — PARTIALLY DONE
A spec was written (`docs/superpowers/specs/2026-03-18-v3-homepage-redesign.md`, 332 lines) and passed automated review. It covered component architecture, animation tiers, page transitions, mobile behavior, and media requirements.

**What the spec missed:**
- No mention of CSS infrastructure dependencies (the `@theme` block, utility classes)
- No mention of the font change (Mona Sans → Outfit)
- No mention of how the old RootLayout's Framer Motion would conflict with GSAP
- The spec described `ScrollTrigger pin: true` as the approach — this was fundamentally wrong and had to be replaced with CSS `position: sticky` during implementation

**Finding:** Specs need a "migration risks" section when building on an existing codebase. What existing patterns will conflict? What infrastructure needs to be carried over or replaced?

### Phase 2: Scaffold — SKIPPED
The plan went directly from spec to implementation. This caused the biggest failure: Task 1 created a clean branch from `main` but didn't verify that the CSS infrastructure (brand colors, utility classes, fonts) existed. Every subsequent task built components that referenced non-existent classes.

**Finding:** The scaffold phase exists for a reason. Even on an existing codebase, the first task should be "verify shared infrastructure" with a visual check, not just "create branch and start building."

### Phase 3: Build — EXECUTION DETAILS BELOW

### Phase 4: Harden — NOT REACHED
Security audit, performance optimization, accessibility (WCAG AA), Lighthouse audit — none of this was done. The session ran out of time fixing scroll bugs and the subpage color swap.

---

## Subagent-Driven Development: Detailed Analysis

### Execution model
15 tasks were created from the plan. Tasks 2-11 (individual components) were dispatched as subagents. Task 12 (composition) was also dispatched. Tasks 13-15 were dispatched as grouped subagents.

### Subagent performance

| Task | Subagent reported | Actual state | Gap |
|---|---|---|---|
| 1: Branch setup | "Build passes" | Correct but missing CSS infrastructure | Critical gap not detected |
| 2: Preloader | "Build passes, committed" | Missing font infrastructure, used raw useEffect initially | Reported fixed but wasn't |
| 3-4: NarrativeStream + Hero | "Both builds passed" | `container-custom` class didn't exist, colors undefined | Silently broken |
| 5-7: ProjectScene + StatBreaker + TrustBar | "All three builds passed" | Same CSS issues, wrong Image prop types | Build passes ≠ UI works |
| 8-11: Simplify + FinalCTA | "All builds passed" | ContactDrawer rewritten without server action, lost functionality | Scope creep in wrong direction |
| 12: Composition | "Build passes, 59 pages" | Components wired but no visual content rendered correctly | Verified build, not UI |
| 13-14: Layout + Inner pages | "Both builds passed" | RootLayout's `overflow-hidden` clipped everything | Framer Motion conflict undetected |
| 15: Polish | "No fixes needed" | 4 components missing reduced-motion guards | Self-review was shallow |

### Key metric
**0 out of 15 subagents ran `pnpm dev` or visually verified their output.**

### Root cause analysis
The subagent-driven development skill instructs subagents to "verify implementation works" but doesn't specify HOW. For backend code, running tests is sufficient. For UI code, "build passes" is meaningless — Tailwind v4 silently ignores undefined classes, TypeScript doesn't catch runtime CSS issues, and Next.js static generation doesn't render client components.

---

## Bug Fix Timeline

After the subagent phase delivered a "complete" but broken site, the session entered a fix cycle. This consumed more time than the initial implementation.

| # | Bug | Attempts to fix | Root cause | Correct fix |
|---|---|---|---|---|
| 1 | Missing CSS classes | 1 | Branch from main had no brand colors | Port globals.css from v2 |
| 2 | Missing fonts | 1 | Mona Sans → Outfit not in layout.tsx | Add Google Fonts imports |
| 3 | Missing GSAPProvider | 1 | Not in layout.tsx | Create provider, add to layout |
| 4 | Missing Preloader in layout | 1 | Not wired into layout tree | Add to layout.tsx |
| 5 | ScrollTrigger pin desync | **7** | Sequential pins with dynamic imports | Replace with CSS `position: sticky` |
| 6 | Footer/CTA invisible | **3** | Framer Motion `layout` prop + `overflow-hidden` | Remove motion.div for homepage path |
| 7 | Title cropping on desktop | **2** | `justify-center` + `overflow-hidden` on section | Top-aligned layout, remove overflow |
| 8 | Mobile address bar bounce | **2** | `vh` units change with bar animation | Use `svh` units, disable Lenis on touch |
| 9 | Narrative layer mispositioned | **4** | Positioned relative to content div, not section | Move to section children, absolute inset-0 |
| 10 | Hydration mismatch | 1 | Non-ISO date string parsed differently | Zero-pad month/day before Date constructor |

**Total: 23 fix attempts for 10 bugs. 7 of those bugs took multiple attempts.**

The ScrollTrigger pin issue alone went through: initial implementation → `ScrollTrigger.refresh()` → MutationObserver → `anticipatePin` → staggered timeouts → image load guards → **CSS sticky** (correct answer). This should have been the first approach, not the seventh.

---

## What Worked

### 1. Brainstorming → spec pipeline
5 design decisions made quickly through visual companion. The spec was thorough and passed review. This phase was efficient.

### 2. Creative design elements
When implemented correctly, the creative choices were validated by the user:
- Preloader arrow zoom (brand imprinting)
- Gradient text fill on project names
- Outline/void letter treatment
- Scatter-bounce metrics with elastic easing
- Layered crossfade (image → narrative → metrics)
- Custom two-part cursor

### 3. CSS sticky architecture (eventually)
The final scroll architecture — CSS `position: sticky` with GSAP only driving animations — is robust and should be the default pattern going forward.

### 4. Edge case handling
Tab visibility, resize debounce, image load guards, preloader safety timeouts, font loading guards — thorough once prompted by user feedback.

---

## What Failed

### 1. Subagent-driven development for UI work
Every subagent reported success while producing broken output. The model assumed "build passes" = "works." For UI work, this assumption is false.

### 2. Architecture choice: ScrollTrigger pin
The spec prescribed `ScrollTrigger pin: true` for project scenes. This was the wrong architecture for sequential dynamically-imported components. 7 fix attempts were needed before switching to CSS sticky.

### 3. Branching strategy
Creating a clean branch from `main` discarded the CSS infrastructure from v2. The solver didn't verify that shared dependencies (colors, classes, fonts, providers) existed before building components that used them.

### 4. Subpage "redesign" was a color swap
The final subpage task changed color tokens across 27 files (`text-neutral-950` → `text-white`, `bg-white` → `bg-primary`). This is find-and-replace, not design. No creative typography, no scroll animations, no cinematic treatment — just inverted colors.

### 5. Framer Motion violation persisted
CLAUDE.md says "Never use Framer Motion." The RootLayout still uses `motion/react` for the nav panel. This caused active bugs (overflow-hidden, layout transform breaking sticky) but was deferred as "separate task" repeatedly.

### 6. Commit discipline
31 commits before the first squash, many fixing the previous commit's bugs. Each commit should represent verified, working state.

---

## Framework-Specific Recommendations

### 1. Add "Visual Verification Gate" to subagent protocol
For any task that produces UI output, the subagent (or the controller after receiving the report) must run `pnpm dev` and verify at 3+ breakpoints. Add this as a mandatory step in `implementer-prompt.md`:
```
## After Implementation (UI tasks only)
Run `pnpm dev` and verify:
- Desktop (1440px): content visible, layout correct
- Tablet (768px): responsive layout, no overflow
- Mobile (390px): stacked layout, touch-friendly
Report what you SEE, not what the build tool says.
```

### 2. Two-strike rule
If a fix doesn't work after 2 attempts, the solver must stop and reconsider the architecture. Add to CLAUDE.md:
```
## Hard rule: two-strike fixes
If a bug fix doesn't work after 2 attempts, STOP.
The approach is wrong. Step back and evaluate whether
the architecture needs to change, not whether the
implementation needs another patch.
```

### 3. Infrastructure-first task for branch creation
When creating a branch from main for a redesign, Task 0 must be:
1. List all CSS custom properties, utility classes, and fonts used by the new design
2. Verify each exists in the branch's globals.css
3. Port or create any missing infrastructure
4. Run dev server and confirm a basic page renders with correct colors/fonts
5. Only then proceed to component tasks

### 4. Spec must include migration risks
Add a required section to spec templates:
```
## Migration Risks
- What existing patterns will conflict with the new design?
- What shared infrastructure needs to be carried over?
- What libraries need to be added/removed?
- What existing components use patterns that conflict?
```

### 5. Creative work cannot be batch-delegated
The subpage redesign should have been a separate brainstorming → spec → build cycle, not a single subagent task with "change colors to dark." Each page type (listing, detail, form, content) needs its own design thinking.

### 6. Standards violations that cause bugs must be fixed immediately
"Will migrate in a separate task" is acceptable for cosmetic issues. When a violation causes active bugs, it must be fixed as part of the current work. The Framer Motion conflict wasted at least 5 fix attempts.

### 7. Subagent count matters
15 subagents for a single-page redesign was too many. The overhead of dispatching, reviewing, and fixing subagent work exceeded the cost of doing the work directly. For UI work, prefer fewer, larger tasks done by the controller with visual verification, over many small tasks delegated to subagents.

---

## Delivered vs. Expected

### Delivered
- Cinematic homepage with scroll-driven narrative (CSS sticky, GSAP scrub)
- 11 new components (homepage/, layout/, ui/)
- Preloader with brand imprinting
- Custom cursor
- Dark theme applied to all pages (color level)
- Edge case handling (tab, resize, image loading, reduced motion)
- View Transition CSS
- Footer redesign with Instagram
- Inner page hero components (CaseStudyHero, BlogArticleHero)
- Error boundary
- GSAPProvider with Lenis
- Spec + plan documents

### Not delivered
- Cinematic subpage experiences matching homepage quality
- Header/navigation redesign
- Framer Motion → GSAP migration
- Loading states / shimmer skeletons
- Performance optimization / Lighthouse audit
- WCAG AA accessibility audit
- Creative treatment for listing pages
- Creative treatment for detail pages
- Properly designed contact form
- Phase 4 (Harden) entirely

### Honest quality assessment

| Area | Quality | Notes |
|---|---|---|
| Homepage scroll experience | 75% | Creative elements strong, some viewport edge cases remain |
| Homepage animations | 80% | GSAP timelines well-structured, CSS sticky robust |
| Subpage visual quality | 30% | Color swap only, no creative design |
| Code architecture | 60% | CSS sticky good, but mixed Framer Motion/GSAP, no tests |
| Mobile experience | 50% | Bounce fixed, but not thoroughly tested across devices |
| Accessibility | 40% | Reduced motion handled, but no audit, no focus management |
| Performance | Unknown | No Lighthouse run performed |
| Production readiness | 35% | Too many untested paths, subpages are placeholder quality |

---

## Conclusion

The solver framework's brainstorming and spec phases are effective. The subagent-driven build phase is unreliable for UI work — it optimizes for throughput (15 tasks dispatched) at the cost of quality (0 tasks visually verified). The framework needs a fundamental principle added:

**For frontend work, the human experience IS the deliverable. If you haven't seen what the user will see, you haven't verified your work.**

The biggest technical lesson: CSS `position: sticky` should be the default for scroll-driven pinned sections, not `ScrollTrigger pin: true`. The biggest process lesson: never trust `pnpm build` as proof that a UI works.
