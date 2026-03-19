export function generateCiCdPatterns(): string {
  return `---
name: ci-cd-patterns
description: Quality gates on every push, deploy from main, secrets management, and service containers
---

# CI/CD Patterns

Continuous integration catches problems before they reach production. Continuous deployment delivers verified code to users without manual gates. These patterns apply regardless of which CI platform you use — GitHub Actions, GitLab CI, CircleCI, Jenkins, Buildkite, or any other.

## Quality Gates on Every Push

Every push to any branch triggers four gates in sequence. If any gate fails, the pipeline stops. Code that doesn't pass all four gates never merges.

### Gate 1: Lint

Run the project's linter and formatter. This catches style violations, unused variables, import issues, and formatting inconsistencies. The gate fails if the linter reports any errors.

\`\`\`
# Example: lint gate
lint-and-format-check
\`\`\`

### Gate 2: Type check

Run the type checker. This catches type errors that the linter misses — incorrect function arguments, missing properties, incompatible types. The gate fails if any type errors exist.

\`\`\`
# Example: type check gate
type-check --no-emit
\`\`\`

### Gate 3: Test

Run the full test suite. Unit tests, integration tests, and any end-to-end tests. The gate fails if any test fails.

\`\`\`
# Example: test gate
run-tests
\`\`\`

### Gate 4: Build

Build the production artifact. This catches issues that only appear during the build step — missing dependencies, incorrect import paths, build configuration errors. The gate fails if the build process exits with an error.

\`\`\`
# Example: build gate
build-production
\`\`\`

### Why this order?

Lint is fastest and catches the most trivial issues. Type checking is next — it's fast and catches structural problems. Tests take longer but verify behavior. Build is last because it's the slowest and depends on everything else being correct. Failing fast saves pipeline minutes.

## Deploy Only from Main

Production deployments only happen from the main branch. Feature branches get the four quality gates. Merging to main triggers deployment.

### Branch strategy

1. Developers work on feature branches
2. Feature branches run all four quality gates on every push
3. Pull requests require passing gates before merge
4. Merging to main triggers deployment to production (or staging, depending on the project's deployment flow)

### Why deploy from main only?

Deploying from feature branches creates confusion about what's in production. Deploy from main means: main IS production. If main is broken, the team knows immediately. If main is green, it's deployable.

## Secrets Management

CI pipelines need access to secrets — API keys, deployment credentials, database passwords. Handle them carefully.

### Principles

- **Never hardcode secrets** in pipeline configuration files
- **Use your CI platform's secret storage** — encrypted variables, secret managers, vault integrations
- **Scope secrets narrowly** — a deployment key shouldn't be available to lint jobs
- **Rotate secrets regularly** — treat them as temporary, not permanent
- **Audit secret access** — know which jobs and which people can read which secrets

### Environment-specific secrets

Keep separate secret sets for staging and production. A staging deployment should never have access to production database credentials.

\`\`\`
# Environment variable naming convention
STAGING_DATABASE_URL=...
PRODUCTION_DATABASE_URL=...
\`\`\`

## Database Service Containers for Tests

Integration tests that need a real database use a service container — a temporary database instance that starts with the pipeline and is destroyed when it ends. This gives tests a real database without depending on shared infrastructure.

### How it works

1. Pipeline starts a service container (e.g., a database instance) alongside the test runner
2. Tests connect to this ephemeral database
3. Each test run starts with a clean database — no state leaks between runs
4. Pipeline destroys the container when tests finish

### Benefits

- **Isolation**: no shared database means no flaky tests from leftover data
- **Speed**: service containers start in seconds
- **Accuracy**: tests run against the same database engine as production
- **Cleanup**: automatic — nothing to maintain after the pipeline ends

### Configuration

Most CI platforms support service containers natively. Configure them in your pipeline definition:

\`\`\`
# Pseudocode pipeline with service container
pipeline:
  services:
    - database-engine:
        image: database-image:version
        ports: [5432]
        env:
          DB_PASSWORD: test

  steps:
    - run: migrate-database
    - run: execute-tests
\`\`\`

## Pipeline Performance

### Caching

Cache dependency installations between runs. Downloading and installing every dependency on every push wastes minutes. Cache the dependency directory keyed by the lockfile hash.

### Parallelism

Run independent gates in parallel where possible. Lint and type check can run simultaneously — neither depends on the other. Tests might depend on a build step or might not.

### Matrix builds

If the project supports multiple runtimes or platforms, use matrix builds to test each combination without duplicating pipeline configuration.

## Checklist

- [ ] Every push triggers lint, type check, test, and build gates
- [ ] Pipeline stops at the first failing gate
- [ ] Production deploys only from main
- [ ] Secrets stored in CI platform's encrypted storage, never in config files
- [ ] Secrets scoped to the jobs that need them
- [ ] Integration tests use service containers, not shared databases
- [ ] Dependency installation is cached between runs
- [ ] Independent gates run in parallel where possible
`;
}
