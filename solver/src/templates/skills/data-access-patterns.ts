export function generateDataAccessPatterns(): string {
  return `---
name: data-access-patterns
description: Service layer isolation, typed returns, validation before writes, and pagination
---

# Data Access Patterns

All database access goes through a service layer. No query runs from a route handler, action, or UI component directly. The service layer is the single place where data enters and leaves the database.

## Service Layer Isolation

Each entity gets its own service file. The service file exports functions — not a class — that handle all CRUD and query operations for that entity.

\`\`\`
// services/project-service
export function findProjectById(id: string): Project | null { ... }
export function createProject(input: CreateProjectInput): Project { ... }
export function listProjectsByOwner(ownerId: string, pagination: PaginationParams): PaginatedResult<Project> { ... }
export function updateProjectStatus(id: string, status: ProjectStatus): Project { ... }
export function deleteProject(id: string): void { ... }
\`\`\`

### Why functions, not classes?

Functions compose better, are easier to test, and don't carry hidden state. A service class with a constructor that takes a database connection creates coupling. A function that receives what it needs as arguments is easier to stub, swap, and reason about.

### Why one file per entity?

When a service handles multiple entities, responsibilities blur. Changes to project queries risk breaking user queries. One file per entity means one reason to change per file.

## Validate Before Writes

Every write operation (create, update, upsert) validates its input against a schema before touching the database. Reads don't need input validation beyond type safety on the arguments (IDs, filters).

The validation schema defines the exact shape the database expects. If the input doesn't match, the service function returns a failure — it never attempts a partial write.

\`\`\`
function createProject(input: unknown): ActionResult<Project> {
  // 1. Validate input against CreateProjectSchema
  // 2. If invalid, return failure with field errors
  // 3. Insert into database
  // 4. Return success with typed result
}
\`\`\`

## Typed Returns

Service functions never return raw database documents. Raw documents leak implementation details — cursor metadata, internal IDs in formats the consumer shouldn't know about, fields that were meant to be internal.

Define a return type for each entity. Map the database document to this type before returning. This mapping is the translation layer between your persistence format and your application format.

\`\`\`
// Bad: return the raw document
function findUser(id) { return db.collection("users").findOne({ _id: id }); }

// Good: map to a typed domain object
function findUser(id): User | null {
  const doc = db.collection("users").findOne({ _id: id });
  if (!doc) return null;
  return mapDocumentToUser(doc);
}
\`\`\`

## Logging in Service Functions

Every service function logs its operations using a child logger scoped to that service. This creates a structured log trail that ties operations to their origin.

\`\`\`
const log = logger.child({ service: "project-service" });

function createProject(input: CreateProjectInput) {
  log.info({ action: "createProject" }, "Creating project");
  // ... perform operation ...
  log.info({ action: "createProject", projectId: result.id }, "Project created");
  return result;
}
\`\`\`

### What to log

- **info**: successful operations with IDs for traceability
- **warn**: unexpected but recoverable situations (e.g., duplicate key handled gracefully)
- **error**: failed operations with context (what was attempted, what failed)

### What NOT to log

- Entire request bodies (may contain sensitive data)
- Passwords, tokens, or secrets (these should be redacted)
- Successful reads in tight loops (creates log noise)

## Pagination Pattern

List operations return paginated results with metadata. The caller sends page/limit parameters; the service returns data plus pagination metadata.

\`\`\`
interface PaginationParams {
  page: number;
  limit: number;
}

interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
\`\`\`

Service functions compute total count and total pages alongside the data query. Default limits prevent unbounded queries — if the caller doesn't specify a limit, use a sensible default (e.g., 20) and a maximum cap (e.g., 100).

## Query Functions

For complex queries (search, filtering, aggregation), create named query functions that describe what they find:

\`\`\`
function findActiveProjectsByOrganization(orgId: string, pagination: PaginationParams): PaginatedResult<Project>
function findOverdueTasksAssignedToUser(userId: string): Task[]
function countProjectsByStatus(orgId: string): Record<ProjectStatus, number>
\`\`\`

Descriptive function names eliminate the need for comments explaining what a query does.

## Transactions

When multiple write operations must succeed or fail together, wrap them in a transaction. A partially completed multi-step write is worse than a complete failure — it leaves data in an inconsistent state that's hard to detect and harder to fix.

## Checklist

- [ ] All database access goes through service functions — no direct queries from handlers
- [ ] One service file per entity
- [ ] Every write operation validates input against a schema
- [ ] Service functions return typed domain objects, not raw documents
- [ ] Every service file creates a child logger
- [ ] List operations return paginated results with metadata
- [ ] Default and maximum limits prevent unbounded queries
- [ ] Multi-step writes use transactions
`;
}
