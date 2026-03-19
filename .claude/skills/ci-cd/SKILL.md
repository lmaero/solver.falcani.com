---
name: ci-cd
description: "GitHub Actions CI/CD pipelines. Use when setting up CI, deployment workflows, quality gates, build pipelines, or automated testing infrastructure."
---

# skill: ci-cd

## purpose
Standard GitHub Actions CI/CD pipeline for falcani projects. Quality gates run on every push and PR. Deployment is target-dependent.

## standard workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "22"
  PNPM_VERSION: "10"

jobs:
  quality:
    name: Quality Gates
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint & Format check
        run: pnpm biome check .

      - name: Type check
        run: pnpm tsc --noEmit

      - name: Run tests
        run: pnpm vitest run
        env:
          # Test environment variables
          MONGODB_URI: mongodb://localhost:27017
          DB_NAME: test_db
          BETTER_AUTH_SECRET: test-secret-minimum-32-characters-long
          BETTER_AUTH_URL: http://localhost:3000
          NEXT_PUBLIC_APP_URL: http://localhost:3000

      - name: Build
        run: pnpm build

    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
```

## deployment additions

### for vercel projects
Vercel auto-deploys via Git integration. The CI pipeline above runs quality gates; Vercel handles deployment. No additional workflow needed.

### for VPS projects (docker)
Add a deploy job that triggers after quality gates pass:

```yaml
  deploy:
    name: Deploy
    needs: quality
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker image
        run: |
          docker build -t ${{ secrets.REGISTRY }}/${{ github.repository }}:${{ github.sha }} .
          docker push ${{ secrets.REGISTRY }}/${{ github.repository }}:${{ github.sha }}

      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /app
            docker compose pull
            docker compose up -d --remove-orphans
```

## package.json scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:indexes": "tsx scripts/setup-indexes.ts",
    "db:seed": "tsx scripts/seed.ts"
  }
}
```

## rules
- quality gates (lint, typecheck, test, build) run on EVERY push and PR
- pipeline uses pnpm — never npm install
- MongoDB service container runs for tests
- deployment only triggers on main branch merges
- secrets are NEVER hardcoded — always GitHub Actions secrets
- frozen lockfile in CI (`--frozen-lockfile`) to ensure reproducible installs
