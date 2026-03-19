---
name: env-validation
description: "Environment variable validation with Zod. Use when creating lib/env.ts, adding new env vars, configuring .env.example, or validating process.env."
---

# skill: env-validation

## purpose
Centralize and validate all environment variables at startup. Never access process.env directly in application code.

## template

```typescript
// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().url("MONGODB_URI must be a valid connection string"),
  DB_NAME: z.string().min(1, "DB_NAME is required"),

  // Auth (better-auth)
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).optional(),

  // Add project-specific variables below
  // STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  // STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  // SMTP_HOST: z.string().min(1),
  // SMTP_PORT: z.coerce.number().default(587),
  // SMTP_USER: z.string().min(1),
  // SMTP_PASS: z.string().min(1),
  // REDIS_URL: z.string().url().optional(),
});

// Validate at import time — app crashes immediately if env is wrong
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables. Check .env.example for required values.");
}

export const env = parsed.data;

// Type-safe access everywhere:
// import { env } from "@/lib/env";
// env.MONGODB_URI  ← typed, validated, guaranteed to exist
```

## .env.example template

```bash
# Database
MONGODB_URI=               # MongoDB connection string (e.g., mongodb://localhost:27017)
DB_NAME=                   # Database name

# Auth (better-auth)
BETTER_AUTH_SECRET=        # Random string, minimum 32 chars. Generate: openssl rand -base64 32
BETTER_AUTH_URL=           # Base URL of the app (e.g., http://localhost:3000)

# App
NEXT_PUBLIC_APP_URL=       # Public URL (same as BETTER_AUTH_URL in most cases)

# Logging (optional)
LOG_LEVEL=                 # fatal | error | warn | info | debug | trace (default: info in prod, debug in dev)
```

## rules
- every env var used in the project MUST be in the Zod schema
- every env var MUST be documented in .env.example with a comment
- NEVER access process.env directly in application code — always through env object
- app MUST crash at startup if required env vars are missing or invalid
- NEVER commit .env files. Only .env.example (with keys, no values)
- use z.string().startsWith() for API keys with known prefixes (e.g., stripe sk_)
- use z.string().optional() only for truly optional variables with sensible defaults
