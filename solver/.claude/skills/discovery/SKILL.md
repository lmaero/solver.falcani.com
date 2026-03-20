---
name: discovery
description: Product-driven discovery process — WHO/WHAT/WHY questions, experience shape reasoning, constraint gathering
---

# Discovery

Discovery is Phase 0 of every project. Before any architecture, any code, any technology choice — understand the humans who will use this product and the problem it solves. Discovery produces a product vision document that feeds into OpenSpec for spec-driven development.

## Product-Driven Questions

Every discovery starts with three questions. Do not proceed until you have clear answers.

### WHO feels the pain?

Identify the specific humans who will use this product. Not "users" — name the role, the context, the expertise level. A warehouse supervisor and a customer are both "users" but have radically different needs, constraints, and mental models.

- What is their role?
- What is their technical comfort level?
- How often will they use this product? Daily? Weekly? Once?
- Are they choosing to use it or mandated to use it?
- What tools do they currently use? (This reveals expectations and migration friction)

### WHAT does their day look like?

Map the human's actual daily workflow. The product must fit into this workflow — not replace it, not fight it, not require them to learn a new way of thinking about their work.

- What triggers the work this product addresses?
- What steps do they currently follow?
- Where do they get stuck, make errors, or waste time?
- What information do they need at each step?
- Who else is involved in their workflow?
- What does "done" look like for them?

### WHY does this product need to exist?

Articulate the specific problem. "They need a dashboard" is not a problem statement. "They spend 2 hours every morning compiling reports from 4 different spreadsheets and still miss critical data" is a problem statement.

- What is the measurable cost of the current process? (time, errors, money, frustration)
- What would success look like? (specific outcomes, not features)
- Why hasn't this been solved already? (reveals constraints and politics)

## Experience Shape Reasoning

The answers to WHO/WHAT/WHY determine the experience shape. Not everything is a dashboard. Choose the shape that matches the human's work pattern, and justify WHY.

### Common shapes and when they fit

**Dashboard** — fits when the user needs to monitor multiple metrics and take action on outliers. The user's job is oversight. They scan, spot, act. Example: operations manager monitoring fulfillment pipeline.

**Workflow builder / process designer** — fits when the user defines repeatable multi-step processes that vary by case. Their job is to design and optimize how work flows. Example: HR manager designing onboarding sequences.

**Canvas / spatial interface** — fits when the user thinks spatially about relationships between items. Drag, connect, arrange. Example: architect designing system topology, designer creating layouts.

**Kanban board** — fits when the user manages work items through sequential stages. Their job is to move things forward and identify bottlenecks. Example: project manager tracking feature development.

**Wizard / constructor flow** — fits when the user performs an infrequent, multi-step process that must be completed correctly. A wizard guides them step by step. Example: first-time business setup, complex configuration.

**Timeline view** — fits when the user needs to see events in chronological order and understand temporal relationships. Example: incident responder reviewing event sequence, project planner scheduling milestones.

**Conversational interface** — fits when the user's needs are unpredictable and best expressed in natural language. Example: support agent querying knowledge base, analyst exploring data.

**Table / list with actions** — fits when the user manages collections of similar items. Search, filter, sort, act on selections. Example: admin managing user accounts, librarian cataloging books.

**Form-centric** — fits when the user's primary job is data entry or data correction. Optimize for speed and accuracy. Example: medical records clerk, invoice processor.

### Anti-patterns

- Defaulting to "dashboard" because it's the most common shape
- Choosing a shape because it looks impressive in demos
- Combining multiple shapes without user research justifying the complexity

## Constraint Gathering

After understanding WHO/WHAT/WHY and choosing an experience shape, gather the technical and business constraints that will shape architecture.

### Internationalization (i18n)
- Is the product multilingual now or potentially in the future?
- Which languages? RTL support needed?
- Do labels, error messages, and content all need translation?

### Authentication and authorization (auth)
- Who provides identity? (own system, SSO, OAuth providers)
- What roles and permissions exist?
- Is multi-tenancy required?
- Session management: how long, where stored?

### External integrations
- Which third-party services does the product interact with?
- Are they API consumers (calling us) or API providers (we call them)?
- Webhooks? Real-time subscriptions? Batch sync?

### Offline support (offline)
- Does the product need to work without internet?
- If yes: what subset of features? How does data sync when reconnected?

### Scale
- How many concurrent users? Expected growth?
- Data volume: how much, how fast, retention period?
- Geographic distribution: single region or global?

### Data migration
- Is there existing data that must be imported?
- What format? How clean is it?
- Migration as a one-time event or ongoing sync?

### Feature flags
- Will features roll out gradually?
- A/B testing requirements?
- Per-tenant feature customization?

### Real-time
- Does the product need live updates? (notifications, collaborative editing, live dashboards)
- What is the acceptable latency?
- WebSockets, SSE, or polling?

## Output: Product Vision Document

Discovery produces a product vision document that feeds into OpenSpec as the initial spec. The document contains:

1. **Problem statement**: WHO, WHAT, WHY — in the human's language, not technical jargon
2. **Experience shape**: chosen shape with justification tied to the human's workflow
3. **Constraints**: all gathered constraints with their implications for architecture
4. **Success criteria**: measurable outcomes, not feature lists
5. **Open questions**: unknowns that need user research or stakeholder input

## Stack Declaration

The human declares the project's technology stack during Phase 0 discovery. The solver framework provides engineering process and quality standards — it does not dictate which database, UI library, or auth provider to use. The stack is chosen based on the project's specific constraints discovered in this phase.

## Checklist

- [ ] WHO is clearly identified with role, context, and expertise level
- [ ] WHAT maps the actual daily workflow, not an idealized version
- [ ] WHY articulates a measurable problem, not a feature request
- [ ] Experience shape is chosen and justified by the human's work pattern
- [ ] All constraint categories have been addressed (even if the answer is "not applicable")
- [ ] Product vision document is complete and feeds into OpenSpec
- [ ] stack is declared based on project constraints
