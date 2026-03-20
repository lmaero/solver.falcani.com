---
name: domain-patterns
description: Domain separation, entity design, state machines, domain errors, and pure functions
---

# Domain Patterns

The domain layer contains the core business logic of the application. It has zero dependencies on frameworks, databases, HTTP layers, or UI libraries. It is pure logic that can be tested, reasoned about, and reused without importing anything from the infrastructure.

## Domain Separation

The domain layer is a directory of pure modules that know nothing about how they are called or where data comes from. The domain doesn't import from the web framework, the database driver, the auth library, or the UI. Dependencies flow inward — infrastructure depends on domain, never the reverse.

```
// Domain layer structure
domain/
  entities/
    order.ts          # Order entity with behavior
    product.ts        # Product entity with behavior
  value-objects/
    money.ts          # Money with currency arithmetic
    email.ts          # Validated email address
  errors/
    domain-errors.ts  # Typed error hierarchy
  services/
    pricing.ts        # Pure pricing calculations
    eligibility.ts    # Eligibility rules
```

### Why strict separation?

When domain logic is tangled with infrastructure, testing requires spinning up databases and web servers. Changes to the web framework force changes to business rules. The domain becomes fragile, slow to test, and impossible to reuse. Strict separation means: domain logic works in a plain test runner with zero setup.

## Entity Design

Entities encapsulate behavior, not just data. An entity is not a bag of properties — it contains the rules for how those properties can change.

### Entities encapsulate invariants

An invariant is a rule that must always be true. The entity enforces it — callers cannot put the entity into an invalid state by setting properties directly.

```
// Bad: entity is just data, rules are scattered elsewhere
order.status = "shipped"  // Who checks if the order CAN be shipped?

// Good: entity enforces the rule
order.ship()  // Throws if order is not in "paid" status
```

### Factory functions over raw construction

Entities are created through factory functions or static methods that validate all inputs. A raw constructor with public fields lets anyone create an entity in an invalid state.

```
// Bad: any combination of fields is allowed
const order = new Order({ status: "shipped", paidAt: null })  // Shipped but never paid?

// Good: factory validates the initial state
const order = Order.create({ items, customer })  // Always starts in "draft" status
```

### Value objects for identity-less concepts

Not everything needs an ID. Money, email addresses, date ranges, coordinates — these are defined by their values, not by identity. Two `Money(100, "USD")` instances are equal. Value objects are immutable: operations return new instances.

```
const price = Money.of(100, "USD")
const discounted = price.subtract(Money.of(20, "USD"))  // Returns new Money(80, "USD")
// price is still Money(100, "USD") — immutable
```

## State Machines

When an entity moves through defined stages (draft -> submitted -> approved -> completed), model it as an explicit state machine. Each state defines which transitions are valid and which are not. Invalid transitions are caught immediately — they never silently succeed.

### Why explicit state machines?

Without a state machine, status transitions are validated by scattered `if` statements. "Can an order go from 'cancelled' to 'shipped'?" requires reading every place where `status` is modified. With a state machine, the answer is in one place.

```
// State machine definition
const orderTransitions = {
  draft:     ["submitted", "cancelled"],
  submitted: ["approved", "rejected", "cancelled"],
  approved:  ["fulfilled", "cancelled"],
  rejected:  ["draft"],    // Can resubmit
  fulfilled: ["completed"],
  cancelled: [],           // Terminal state
  completed: [],           // Terminal state
}

// Transition function
function transitionOrder(order, targetStatus) {
  const validTargets = orderTransitions[order.status]
  if (!validTargets.includes(targetStatus)) {
    throw new InvalidTransitionError(order.status, targetStatus)
  }
  // Apply the transition
}
```

### Side effects on transition

State transitions often trigger side effects: send an email on approval, update inventory on fulfillment, notify billing on cancellation. These side effects live OUTSIDE the domain — in an application service or event handler. The domain entity transitions its state. The infrastructure reacts.

## Domain Error Hierarchy

Domain errors are typed, not string messages. A typed error hierarchy lets the boundary layer (HTTP handler, CLI, etc.) map domain errors to appropriate responses without string matching.

```
// Error hierarchy
DomainError (base)
  ├── NotFoundError         -> 404
  ├── ValidationError       -> 400
  ├── ConflictError         -> 409
  ├── PermissionError       -> 403
  ├── InvalidTransitionError -> 422
  └── BusinessRuleError     -> 422
```

Each error carries:
- A machine-readable code (e.g., `ORDER_ALREADY_SHIPPED`)
- A human-readable message (e.g., "This order has already been shipped")
- Optional context data (e.g., `{ orderId, currentStatus }`)

The boundary layer catches domain errors and maps them to HTTP status codes, CLI exit codes, or user-facing messages. The domain never knows about HTTP — it only knows about its own error types.

## Pure Functions, Side Effects at Edges

Domain logic is implemented as pure functions wherever possible. A pure function:
- Returns the same output for the same input
- Does not modify external state
- Does not read from external state (no database queries, no HTTP calls, no file reads)

Side effects (database writes, emails, notifications, API calls) happen at the edge — in application services, event handlers, or infrastructure adapters. The domain computes what SHOULD happen. The infrastructure MAKES it happen.

```
// Pure domain function: computes the result
function calculateDiscount(order, customerTier, promotions) {
  // Pure calculation — no side effects, no I/O
  return { discountAmount, appliedPromotions, finalPrice }
}

// Application service: orchestrates side effects
function applyDiscount(orderId) {
  const order = orderRepo.findById(orderId)          // Side effect: read
  const customer = customerRepo.findById(order.customerId)  // Side effect: read
  const promotions = promoService.getActive()         // Side effect: read

  const result = calculateDiscount(order, customer.tier, promotions)  // Pure

  orderRepo.updatePrice(orderId, result.finalPrice)   // Side effect: write
  auditLog.record("discount_applied", result)         // Side effect: write
}
```

### Benefits

- Domain functions are trivially testable — no mocks, no setup, no teardown
- Business rules are readable in isolation
- Side effects are visible and contained
- The same domain logic works in any context (web handler, CLI, background job, test)

## Checklist

- [ ] Domain layer has zero imports from framework, database, or infrastructure
- [ ] Entities encapsulate invariants — callers cannot create invalid state
- [ ] Entities are created through factory functions that validate initial state
- [ ] Identity-less concepts are modeled as immutable value objects
- [ ] Status progressions use explicit state machine definitions
- [ ] Invalid state transitions throw typed domain errors
- [ ] Error hierarchy maps cleanly to boundary response codes
- [ ] Business logic is implemented as pure functions
- [ ] Side effects live in application services at the edge, not in domain
