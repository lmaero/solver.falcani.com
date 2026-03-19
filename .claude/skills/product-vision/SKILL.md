---
name: product-vision
description: "Product vision documents for Phase 0. Use when starting a new project, conducting discovery, creating PRODUCT-VISION.md, or defining what a product should be and who it serves."
---

# skill: product-vision

## purpose
After Phase 0 discovery, produce a comprehensive product vision document that captures the soul of the product. This document lives at `docs/PRODUCT-VISION.md` and is the permanent reference for what the product IS, who it serves, and why it exists. The agent reads this before every architectural decision.

This is NOT a technical specification. The falcani framework (CLAUDE.md, skills, conventions) handles all technical decisions. The product vision focuses entirely on: the people, the problem, the experience, and the outcome.

## when to produce
Immediately after Phase 0 discovery, before Phase 1 architecture. The vision document IS the deliverable of Phase 0 — it's what gets approved before architecture begins.

## template

```markdown
# [product name] — product vision

> One sentence that captures what this product does for the person using it.
> Not what it IS. What it DOES for them.

---

## the problem

### who feels this pain

[Describe the real humans who will use this. Not "users" — people with job titles, daily routines, frustrations. Use the language they would use, not technical language. Name 1-3 distinct roles if the product serves multiple.]

Example:
> Marina runs a 120-person logistics company. She spends the first two hours of every morning reconciling shipping data across three different spreadsheets. She knows exactly which cells to check because she built the system herself four years ago. Nobody else on her team fully understands it. She's terrified of taking a vacation.

### what their day looks like today

[Walk through the actual workflow they're doing manually or with broken tools. Be specific — times, steps, frustrations, workarounds. This is the "before" picture.]

Example:
> 6:30am — Marina opens the master spreadsheet. Cross-references yesterday's shipments against the carrier's portal (manual copy-paste, ~45 minutes). Flags discrepancies in a separate tab. Emails the warehouse team about three missing confirmations. Waits for responses. Around 9am, compiles a summary for her operations manager, who immediately asks for a different breakdown. Marina rebuilds the summary. By 10am, she hasn't started her actual work for the day.

### what breaks, and what it costs

[Quantify the pain. Hours wasted, errors that slip through, opportunities missed, stress on the team. Real numbers where possible, honest estimates where not.]

Example:
> Marina spends ~15 hours/week on reconciliation. Her team spends another ~8 hours responding to her data requests. Two shipping errors per month go undetected for 48+ hours because the manual cross-check missed them. Each error costs approximately $2,000 in client credits and relationship damage.

---

## the vision

### what their day looks like after

[The "after" picture. Same specificity as the "before," but now with the product in place. Don't describe features — describe the experience. What does their morning look like? What don't they have to do anymore? What new thing can they do that was impossible before?]

Example:
> 6:30am — Marina opens the dashboard. Yesterday's shipments are already reconciled. Three discrepancies are flagged with suggested resolutions. She approves two with one click, investigates the third, and resolves it in four minutes. By 6:45am, she's done. The operations manager's summary auto-generated overnight. Marina starts her actual work before 7am for the first time in years.

### the experience shape

[This is the critical section that prevents defaulting to "sidebar + data table." Based on the user's actual work, what is the right interaction model? Consider all possibilities before settling:]

Choose one or combine:
- **Dashboard with live feeds** — when the user needs a real-time overview with drill-down
- **Workflow/pipeline builder** — when the user's work is a series of connected steps (like n8n)
- **Infinite canvas** — when the user needs spatial reasoning, connections between ideas (like Figma, Excalidraw)
- **Kanban/board view** — when work moves through stages
- **Timeline/calendar** — when time is the primary organizing dimension
- **Wizard/constructor flow** — when the user builds something step by step
- **Conversational interface** — when the user's input is unstructured and the system guides them
- **List/table with powerful filters** — when the user scans, searches, and acts on records
- **Form-heavy process** — when data collection IS the product (intake, assessment, onboarding)
- **Map/spatial view** — when location is the primary context
- **Hybrid** — describe the combination and why

[Explain WHY this shape matches how the user thinks about their work. The shape should feel inevitable once you see it, not imposed.]

Example:
> Marina's work is fundamentally a reconciliation pipeline — data comes in from multiple sources, gets matched, discrepancies surface, and she resolves them. The right shape is a **pipeline view** with three columns: Incoming (unmatched), Matched (auto-reconciled), and Flagged (needs human decision). This mirrors how she already thinks about the work — she sorts her spreadsheet into these three mental categories every morning. The software just makes the categories real and does the matching for her.

### what "done" feels like

[The emotional outcome. Not "the user can track expenses" but how they FEEL. This guides every micro-decision about the UX.]

Example:
> Marina feels like she has her mornings back. The system doesn't just save her time — it removes the anxiety of wondering what she missed. She can take a vacation and know the reconciliation will happen without her. When she opens the app, it feels like a calm, competent colleague already did the work and is waiting for her to sign off.

---

## scope

### what this product does (version 1)

[Concrete capabilities for the first version. Not features — outcomes. Each one should trace back to a specific pain from "the problem" section. If a capability doesn't eliminate a pain, question why it exists.]

1. [Capability] — eliminates [specific pain]
2. [Capability] — eliminates [specific pain]
3. [Capability] — eliminates [specific pain]

Example:
> 1. Auto-reconciles shipment data from carrier portals against internal records — eliminates the 45-minute daily manual cross-check
> 2. Flags discrepancies with context and suggested resolution — eliminates the detective work of figuring out what went wrong
> 3. Generates operations summary on schedule — eliminates the "rebuild the report in a different format" cycle
> 4. Tracks resolution history — eliminates the "didn't we have this same problem last month?" guesswork

### what this product does NOT do (version 1)

[Equally important. Explicit exclusions prevent scope creep and set honest expectations. Each exclusion should note when it might be reconsidered.]

Example:
> - Does NOT replace the carrier portals themselves (out of scope; revisit if clients request API integrations in V2)
> - Does NOT handle invoicing or billing (separate domain; could integrate in V3)
> - Does NOT support offline mode (revisit if warehouse staff need mobile access without connectivity)

---

## the people

### primary user

**Name/role:** [the person who uses this daily]
**Tech comfort:** [how comfortable are they with software, honestly]
**What they care about:** [what motivates them in their work]
**What they fear:** [what keeps them from adopting new tools]
**How they'll judge this product:** [what makes them say "this works" vs "this is another failed tool"]

### secondary users

[Other roles who interact with the product, with less detail but enough to design for them]

### the buyer (if different from the user)

[The person who approves the purchase. What do they need to see/hear? Usually the CEO/owner (Linda) or the CFO (Sophie) from the falcani persona framework.]

---

## success signals

### we know it's working when...

[Observable, measurable outcomes. Not "user satisfaction" — real signals you can see without asking.]

1. [Signal] — measured by [how]
2. [Signal] — measured by [how]
3. [Signal] — measured by [how]

Example:
> 1. Marina's reconciliation takes under 10 minutes instead of 2 hours — measured by time-to-completion tracking
> 2. Undetected shipping errors drop to zero — measured by error log vs manual audit comparison
> 3. The operations manager stops requesting custom report formats — measured by report generation logs (they use the auto-generated one)

### we know it's failing when...

[Anti-signals. What would tell us the product isn't solving the real problem?]

Example:
> 1. Marina still opens the spreadsheet every morning "just to double-check"
> 2. The team creates workarounds outside the system
> 3. Discrepancy resolution takes longer in the app than it did manually

---

## constraints & context

**Timeline:** [when does this need to be usable]
**Budget context:** [what the client expects to invest — not pricing, just awareness of scale]
**Existing systems:** [what does this need to integrate with or replace]
**Data migration:** [is there existing data that needs to come over, how much, how messy]
**Regulatory/compliance:** [any industry-specific requirements]
**Language:** [primary language, bilingual needs]

---

*This document is the soul of the product. Every architectural decision, every feature priority, every UX choice should trace back to something written here. If it can't, question whether it belongs.*
```

## how the agent uses this document

1. **Phase 0:** Agent conducts discovery conversation, then produces this document
2. **Approval gate:** The human (Luis or the client) reviews and approves the vision before Phase 1 begins
3. **Phase 1:** Agent reads this document and produces architecture that serves the vision — data model maps to the capabilities, the experience shape determines the frontend architecture, the people section informs UX decisions
4. **Phase 3 (build):** Before building any feature, agent checks: does this feature trace back to a capability in the vision? Does it match the experience shape?
5. **Ongoing reference:** The document lives at `docs/PRODUCT-VISION.md` in the repo. Any solver (human or agent) joining the project reads this first

## what this replaces

This replaces unstructured "big prompts" like:
> "Build me an expense tracker with NextJS, TypeScript, Tailwind, responsive design, charts, export to CSV..."

That kind of prompt produces generic software. The falcani product vision produces software shaped around real human work.

## rules
- the product vision NEVER specifies technology — the framework handles that
- the "experience shape" section is mandatory — the agent must justify why this shape fits the user's work
- every capability in scope must trace back to a specific pain
- the "what this does NOT do" section is mandatory — no scope without boundaries
- the vision must be written in plain language that the client can read and understand
- the "before and after" sections use the same level of specificity — you can feel the difference
- the success/failure signals must be observable without asking the user
- this document gets version-controlled and updated as the product evolves
