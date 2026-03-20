---
name: testing-strategy
description: TDD scope, SRP as testing enabler, what to test, what makes a good test
---

# Testing Strategy

Testing is not about coverage percentages — it's about confidence in the system's behavior. This strategy defines what to test, when to write tests, and how to write tests that actually catch bugs.

## TDD Mandatory Scope

Write tests BEFORE implementation for these categories. The test defines the expected behavior; the implementation makes the test pass.

### Business rules
Any logic that answers "is this allowed?" or "what should happen when?" is a business rule. Business rules are the reason the software exists — they must be tested first.

Examples:
- Discount calculations: "orders over 500 get 10% off"
- Eligibility checks: "users with overdue invoices cannot place new orders"
- Pricing tiers: "enterprise customers pay per-seat, starter customers pay flat rate"

### Domain logic
Pure functions that transform data according to domain rules. These are the computations at the heart of the application.

Examples:
- Date range calculations: "next billing date based on subscription start"
- Status derivation: "order is 'overdue' when payment date is past and status is 'pending'"
- Aggregations: "total inventory across warehouses minus reserved quantities"

### Mutations
Every operation that changes system state gets a test first. The test verifies both the success path and the failure path.

Examples:
- Creating, updating, deleting entities
- Status transitions
- Bulk operations

### Permission checks
Authorization logic determines what users can and cannot do. Permission bugs are security bugs — test first, always.

Examples:
- "Admin can delete any project, member can only delete own projects"
- "Viewer role cannot access billing settings"
- "API key scoped to read-only cannot trigger writes"

### Data transformations
Any function that reshapes data from one format to another. Transformation bugs are subtle and cascade.

Examples:
- API response mapping
- CSV/Excel import parsing
- Report generation from raw data

## Tests After Implementation

Write tests AFTER the code works for these categories. The code is straightforward enough that writing it first doesn't sacrifice confidence.

### Data access queries (after implementation)
Database queries are best tested by running them against a test database. Write the query, verify it returns correct results, then add a test to lock the behavior.

### Route handlers (after implementation)
HTTP handlers that wire together validation, business logic, and response formatting. Test the integration after the pieces are assembled.

### Utility functions (after implementation)
Pure helper functions (string formatting, date parsing, array manipulation) that are simple enough to verify by inspection but worth locking with a test.

## No Tests Needed

Some code doesn't benefit from testing. Testing it wastes time without adding confidence.

### UI components with single responsibility
A component that renders props and emits events doesn't need a test — the type system and visual review catch issues. If a component contains business logic, the problem is the component design, not the lack of tests — extract the logic to a pure function and test that.

### Configuration files (config)
Static configuration (environment mappings, feature flag definitions, route tables) is validated at startup. If the config is wrong, the app won't start. A test that duplicates the config adds maintenance burden without catching different bugs.

### Static content
Marketing pages, help text, static content, and copy. These change often and are verified visually. Testing that a string equals a string is meaningless.

### Seed scripts
Database seeding scripts run once during development setup. They're verified by running them. A test for a seed script would essentially duplicate the script.

## SRP as Testing Enabler

The single responsibility principle is not just about clean code — it's the foundation of testability. When a function does one thing, it's easy to test. When a function does five things, testing it requires complex setup, mocks, and assertions.

### The rule

If you need to test logic that's inside a UI component, the design is wrong. Extract it to a pure function. Test the pure function. Let the component call the function.

```
// Bad: business logic inside a component — untestable without rendering
function OrderSummary({ items, coupon }) {
  // 15 lines of discount calculation
  // 10 lines of tax computation
  // 5 lines of shipping logic
  return <div>{total}</div>
}

// Good: logic extracted to testable pure functions
function calculateOrderTotal(items, coupon) {
  // All the math — testable with simple inputs and assertions
  return { subtotal, discount, tax, shipping, total }
}

function OrderSummary({ items, coupon }) {
  const totals = calculateOrderTotal(items, coupon)
  return <div>{totals.total}</div>
}
```

### Symptoms that SRP is violated

- Test setup requires more than 5 lines
- You need to mock more than 2 dependencies
- A single test file has more than 200 lines for one function
- Changing one behavior breaks tests for unrelated behavior

## What Makes a Good Test

### Verify behavior, not implementation

A good test says "when I do X, Y happens." A bad test says "function calls method A, then method B, then returns." Implementation tests break when you refactor — behavior tests survive.

```
// Bad: tests implementation
expect(mockRepo.save).toHaveBeenCalledWith({ status: "active" })

// Good: tests behavior
const result = activateAccount(accountId)
expect(result.status).toBe("active")
```

### Mock at boundaries, not internally

Mock external systems (databases, APIs, email services) at the boundary. Don't mock internal functions. If you need to mock an internal function, the code is too coupled — refactor it.

```
// Bad: mocking an internal calculation function
jest.mock("./calculateDiscount")

// Good: mocking the external boundary
const fakeRepo = { findById: () => testOrder, save: () => {} }
const result = processOrder(fakeRepo, orderId)
```

### One assertion per concept

Each test verifies one concept. Multiple assertions are fine if they all verify the same concept from different angles. Multiple assertions verifying different concepts belong in separate tests.

```
// Good: multiple assertions, one concept (the success result shape)
expect(result.success).toBe(true)
expect(result.data.id).toBeDefined()
expect(result.data.status).toBe("active")

// Bad: multiple concepts in one test
expect(result.success).toBe(true)         // Success path
expect(auditLog).toHaveLength(1)          // Side effect — separate test
expect(emailSent).toBe(true)              // Another side effect — separate test
```

### Descriptive test names

Test names describe the scenario and the expected outcome. Someone reading just the test name should understand what behavior is being verified.

```
// Bad
it("works correctly")
it("handles edge case")

// Good
it("applies 10% discount when order total exceeds 500")
it("rejects order when customer has overdue invoices")
it("returns empty array when no projects match the filter")
```

### Arrange-Act-Assert

Every test follows the same three-step structure:
1. **Arrange**: set up the inputs and preconditions
2. **Act**: execute the function or operation being tested
3. **Assert**: verify the result matches expectations

## Checklist

- [ ] Business rules, domain logic, mutations, permissions, and data transformations have TDD tests
- [ ] Data access, route handlers, and utilities have tests written after implementation
- [ ] UI components don't contain testable business logic — it's extracted to pure functions
- [ ] Tests verify behavior, not implementation
- [ ] External dependencies are mocked at boundaries, not internally
- [ ] Test names describe the scenario and expected outcome
- [ ] Tests follow Arrange-Act-Assert structure
