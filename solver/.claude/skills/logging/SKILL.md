---
name: logging
description: Structured logging with Pino — levels, redaction, child loggers, and correlation
---

# Logging

Pino is the framework-mandated structured logger. This is infrastructure, not a project choice — every project uses Pino for logging. No `console.log`, `console.error`, or `console.warn` in production code.

## Logger Setup

Create a root logger in a central module (e.g., `lib/logger`). All other code imports from this module. The root logger configures:

- Log level from environment (defaulting to "info")
- Redaction paths for sensitive fields
- Pretty printing in development, JSON in production
- Base fields included in every log entry (service name, version)

```
// lib/logger — root logger
const logger = pino({
  level: env.LOG_LEVEL || "info",
  redact: ["password", "token", "secret", "authorization", "cookie"],
  transport: env.NODE_ENV === "development"
    ? { target: "pino-pretty" }
    : undefined,
  base: { service: "my-app" },
});

export { logger };
```

## Log Levels

Pino provides six levels. Use them with intention:

### fatal
The process cannot continue. Use right before the process exits. Examples: failed to bind to port, database connection permanently lost, invalid configuration at startup.

### error
An operation failed and requires attention. The process continues but something is wrong. Examples: unhandled exception in a request handler, third-party API returned an unexpected error, data integrity violation.

### warn
Something unexpected happened but the operation completed (possibly with degraded behavior). Examples: deprecated API usage detected, fallback to default value, rate limit approaching.

### info
Normal operational events worth recording. Examples: server started, request completed, background job finished, user authenticated, deployment completed. This is the default production level.

### debug
Detailed information useful during development and troubleshooting. Examples: query parameters, intermediate calculation results, cache hit/miss, retry attempts. Not enabled in production by default.

### trace
Extremely detailed information. Examples: function entry/exit, full request/response bodies (redacted), step-by-step algorithm execution. Only enabled during active debugging of specific issues.

## Redaction

Sensitive fields are redacted from log output automatically. Configure redaction paths in the root logger. Any log entry containing these field names will have their values replaced with `[Redacted]`.

Common redaction paths:
- `password`, `newPassword`, `currentPassword`
- `token`, `accessToken`, `refreshToken`
- `secret`, `apiKey`, `apiSecret`
- `authorization`, `cookie`
- `creditCard`, `ssn`
- Nested paths: `user.password`, `headers.authorization`

### Deep redaction

For nested objects, use wildcard paths:
```
redact: ["*.password", "*.token", "headers.authorization"]
```

## Child Loggers

Every service, domain module, or significant subsystem creates a child logger from the root. Child loggers inherit the root configuration and add context fields that appear in every log entry from that child.

```
// services/project-service
import { logger } from "../lib/logger";
const log = logger.child({ service: "project-service" });

// Every log from this file includes { service: "project-service" }
log.info({ projectId: "abc" }, "Project created");
// Output: { level: "info", service: "project-service", projectId: "abc", msg: "Project created" }
```

### Naming convention

Child loggers use a `service` field for service-layer modules and a `module` field for infrastructure:
```
logger.child({ service: "user-service" })
logger.child({ service: "billing-service" })
logger.child({ module: "email-transport" })
logger.child({ module: "cache" })
```

## Request Correlation IDs

Every incoming request gets a unique correlation ID. This ID propagates through all log entries for that request, making it possible to trace a single request across services and log entries.

### How it works

1. Incoming request arrives
2. Extract correlation ID from headers (e.g., `x-request-id`) or generate a new one
3. Create a child logger with `{ requestId: correlationId }`
4. Pass this logger (or the correlation ID) through the request lifecycle
5. Every log entry for this request includes the correlation ID

```
// Request handler
function handleRequest(req, res) {
  const requestId = req.headers["x-request-id"] || generateId();
  const log = logger.child({ requestId });
  log.info({ method: req.method, path: req.path }, "Request received");
  // ... pass log to services ...
  log.info({ statusCode: res.statusCode }, "Request completed");
}
```

### Cross-service tracing

When calling other services, forward the correlation ID in request headers. This enables tracing a user action across multiple services in a distributed system.

## Output Format

### Development: pretty printing

In development, logs are human-readable with colors, timestamps, and formatted objects. Use `pino-pretty` as a transport. Developers read these in a terminal — clarity matters more than parseability.

### Production: JSON

In production, every log entry is a single JSON line. This format is:
- Parseable by log aggregation tools (ELK, Datadog, CloudWatch, Loki)
- Searchable by field
- Machine-processable for alerts and dashboards
- Space-efficient for storage

Never use pretty printing in production — it's slower and harder to parse programmatically.

## What to Log

- Request lifecycle: received, completed (with duration and status)
- Business events: user registered, order placed, payment processed
- State transitions: status changes, workflow steps
- External calls: API requests sent and responses received (with duration)
- Errors: with full context for debugging

## What NOT to Log

- Passwords, tokens, or secrets (rely on redaction as a safety net, not as the primary strategy)
- Full request/response bodies in production (too verbose, may contain PII)
- Successful reads in tight loops (creates log noise, overwhelms storage)
- Anything that would violate user privacy regulations (GDPR, CCPA)

## Checklist

- [ ] Root logger configured in a central module
- [ ] Log level controlled by environment variable
- [ ] Sensitive fields listed in redaction configuration
- [ ] pretty in development, JSON in production
- [ ] Every service file creates a child logger with identifying context
- [ ] Request correlation IDs generated or extracted for every incoming request
- [ ] No `console.log` / `console.error` / `console.warn` in production code
