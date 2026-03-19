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

| Command | Description | Status |
|---------|-------------|--------|
| `solver init` | Scaffold framework files into a project | Available |
| `solver doctor` | Check project health against framework standards | Available |
| `solver update` | Compare framework files against latest templates | Available |
| `solver uninstall` | Remove framework files, keep ecosystem files | Available |
| `solver scan` | Scan codebase for pattern violations | Coming soon |
| `solver audit` | Full codebase audit against framework standards | Coming soon |
| `solver migrate` | Migrate between framework versions | Coming soon |
| `solver report` | Generate project health report | Coming soon |

## Ecosystems

- `ts` — TypeScript (Biome, Vitest, Pino)
- `cpp` — C++ (coming soon)

## Spec

See [solver framework v2 design spec](../docs/superpowers/specs/2026-03-19-solver-framework-v2-design.md).

## License

MIT
