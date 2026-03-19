---
name: logging
description: "Pino logger setup and structured logging. Use when creating lib/logger.ts, adding logging to Server Actions, configuring log levels, or setting up request context logging."
---

# skill: logging

## purpose
Standardize application logging with Pino. Zero console.log in production. Structured JSON in production, pretty in development.

## setup template

```typescript
// lib/logger.ts
import pino from "pino";
import { env } from "@/lib/env";

const isDev = process.env.NODE_ENV === "development";

export const logger = pino({
  level: env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "yyyy-mm-dd HH:MM:ss",
        },
      }
    : undefined,
  redact: {
    paths: [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "secret",
      "authorization",
      "cookie",
      "*.password",
      "*.token",
      "*.secret",
    ],
    censor: "[REDACTED]",
  },
  base: {
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION ?? "unknown",
  },
});

// Use child loggers for context
// const log = logger.child({ service: "users", requestId: "abc-123" });
```

## required dependencies

```bash
pnpm add pino
pnpm add -D pino-pretty
```

## level guidelines

| level | numeric | when |
|-------|---------|------|
| fatal (60) | 60 | process crashing. database permanently lost. critical config missing at startup |
| error (50) | 50 | caught exception in handler. third-party API failure. rejected database write. ALWAYS include: error object, operation name, context to reproduce |
| warn (40) | 40 | retry succeeded after failure. deprecated feature used. rate limit approaching. fallback triggered. "look at this today, not right now" |
| info (30) | 30 | user signed up. order placed. payment processed. migration complete. ONE info log per significant business event |
| debug (20) | 20 | query times. cache hit/miss. sanitized payloads. decision branches. dev only unless actively debugging production |
| trace (10) | 10 | function entry/exit. variable states. almost never used |

## usage patterns

```typescript
// good — structured, contextual
log.info({ userId, orderId, total }, "order placed");
log.error({ err, userId, operation: "createOrder" }, "failed to create order");
log.warn({ retryCount: 3, service: "stripe" }, "payment retry succeeded");

// bad — unstructured, no context
log.info("Order placed");
log.error("Error: " + err.message);
console.log("debug:", data); // NEVER
```

## request context pattern

Create a child logger per request with correlation ID:

```typescript
// In Server Actions or Route Handlers
import { headers } from "next/headers";
import { logger } from "@/lib/logger";

export async function createOrder(formData: FormData) {
  const headersList = await headers();
  const requestId = headersList.get("x-request-id") ?? crypto.randomUUID();
  const log = logger.child({ requestId, action: "createOrder" });

  log.info("starting order creation");
  // ... use log throughout the action
}
```

## hard rules
- never console.log, console.error, console.warn in production code
- never log passwords, tokens, full credit card numbers, PII without redaction
- pino-pretty is a devDependency ONLY — never imported in production
- every service file creates a child logger: `logger.child({ service: "name" })`
- error logs ALWAYS include the error object as `err` (Pino serializes it properly)
- info level: one log per business event, not per internal step
