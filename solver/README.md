# @falcani/solver

Pattern authority and engineering discipline system for AI-assisted development.

## Install

```sh
pnpm add -g @falcani/solver
```

## Quick start

```sh
solver init --ecosystem ts
```

## Commands

| Command | Description |
|---------|-------------|
| `solver init [--ecosystem ts\|cpp]` | Scaffold framework into any project |
| `solver scan` | Analyze codebase and generate scan report |
| `solver audit` | Run phase completion checks and display scorecard |
| `solver doctor` | Verify framework installation health |
| `solver migrate` | Generate migration assessment for existing codebase |
| `solver report` | Generate a structured field report |
| `solver update` | Compare framework files against latest and show diffs |
| `solver uninstall` | Clean removal of framework files |

## Ecosystems

- `ts` — TypeScript (Biome, Vitest, Pino)
- `cpp` — C++ (coming soon)

## Spec

See [solver framework v2 design spec](../docs/superpowers/specs/2026-03-19-solver-framework-v2-design.md).

## License

MIT
