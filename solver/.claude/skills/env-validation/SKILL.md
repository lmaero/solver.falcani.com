---
name: env-validation
description: Environment variable schema validation at startup with typed access
---

# Environment Validation

Environment variables are validated at application startup. If any required variable is missing or malformed, the application must crash immediately with a clear error message. Invalid configuration must never reach running code.

## Crash on Invalid Configuration

The application defines a schema for its environment variables. At startup, the schema is evaluated against the actual environment. If validation fails, the process exits with a non-zero code and logs exactly which variables failed and why.

```
// Startup behavior:
// 1. Load environment variables
// 2. Validate against schema
// 3. If invalid: log errors, crash immediately
// 4. If valid: export the validated, typed object
```

### Why crash immediately?

A misconfigured application is worse than a stopped application. Running with a missing database URL will crash later — probably under load, probably with a confusing error, probably at 2 AM. Crashing at startup makes the problem obvious, immediate, and fixable before any user is affected.

## The Validated Object

After validation, the application exports a single typed object containing all validated environment variables. Application code imports this object — never reads `process.env` directly.

```
// Bad: raw access scattered throughout the codebase
const dbUrl = process.env.DATABASE_URL; // string | undefined — is it set? is it valid?

// Good: validated access through typed object
import { env } from "./env";
const dbUrl = env.DATABASE_URL; // string — guaranteed to exist and match the schema
```

### Benefits of the validated object

- **Type safety**: the object's type reflects exactly what variables exist and their types
- **Single source**: no variable is accessed from two different spellings or locations
- **Default values**: applied during validation, not scattered across consumption sites
- **Transformation**: string-to-number conversion, URL parsing, boolean coercion happen once at startup

## Schema Design

The environment schema should handle:

- **Required variables**: missing = crash with clear message
- **Optional variables with defaults**: missing = use default, present = validate format
- **Type coercion**: PORT as a number, DEBUG as a boolean, ALLOWED_ORIGINS as an array
- **Format validation**: URLs, email addresses, connection strings match expected patterns
- **Enum constraints**: NODE_ENV is one of "development", "production", "test"

```
// Pseudocode schema
{
  NODE_ENV: enum("development", "production", "test"),
  PORT: number().default(3000),
  DATABASE_URL: string().url().required(),
  SESSION_SECRET: string().min(32).required(),
  LOG_LEVEL: enum("fatal", "error", "warn", "info", "debug", "trace").default("info"),
  ALLOWED_ORIGINS: string().transform(s => s.split(",")).default(""),
}
```

## .env.example Documentation

Every project includes a `.env.example` file that documents every environment variable the application uses. This file:

- Lists every variable from the schema
- Includes a comment explaining what each variable does
- Shows example values (never real secrets)
- Indicates which are required vs optional
- Groups variables by concern (database, auth, external services, etc.)

```
# Database
DATABASE_URL=postgresql://localhost:5432/myapp  # Required. Connection string for the primary database.

# Auth
SESSION_SECRET=change-me-to-a-random-string-at-least-32-chars  # Required. Must be at least 32 characters.

# Server
PORT=3000          # Optional. Defaults to 3000.
NODE_ENV=development  # Optional. One of: development, production, test.
LOG_LEVEL=info     # Optional. One of: fatal, error, warn, info, debug, trace.

# External Services
SMTP_HOST=          # Optional. Required for email features.
SMTP_PORT=587       # Optional. Defaults to 587.
```

## Adding New Variables

When adding a new environment variable:

1. Add it to the schema with appropriate validation and type
2. Add it to `.env.example` with documentation and example value
3. Add it to `.env` locally (and any deployment configurations)
4. If required: coordinate with team — the app will crash on next deploy if the variable is missing
5. If optional with a default: safe to deploy without coordination

## Sensitive Variables

Variables containing secrets (API keys, tokens, passwords) get extra treatment:

- Never log their values, even at debug level
- Never include real values in `.env.example`
- Never commit them to version control
- Mark them in the schema documentation as sensitive

## Lazy validation for scripts and tools

The default pattern validates eagerly at module load — the app crashes if any env var is missing. This is correct for the main application.

For standalone scripts (seed scripts, migrations, CLI tools) that only need a subset of env vars, use a lazy pattern:

- Create a separate schema for the script's needs (e.g., `seedEnvSchema` with only `DATABASE_URL`)
- Or use `.partial()` on the main schema and validate only what you need
- Never import the main `env.ts` in scripts that don't need all variables

The principle remains: validate at startup, crash if invalid. But "startup" means the script's startup, and "invalid" means the vars the script actually needs.

## Checklist

- [ ] Environment schema validates all variables at startup
- [ ] Application crashes immediately with clear error messages on invalid config
- [ ] All env access goes through the validated typed object — never raw `process.env`
- [ ] `.env.example` documents every variable with comments and example values
- [ ] Type coercion and defaults are handled in the schema, not at consumption sites
- [ ] Sensitive variables are never logged or committed
- [ ] Standalone scripts use a separate or partial schema — never import the main env.ts
