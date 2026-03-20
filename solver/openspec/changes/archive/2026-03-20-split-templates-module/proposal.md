## Why

`src/analysis/templates.ts` is 513 lines, violating the framework's own 400-line threshold. The `solver scan` command flagged it during self-testing. The file mixes three unrelated template generators (scan, report, migrate) plus shared formatting helpers. Splitting it improves maintainability and lets the framework pass its own audit.

## What Changes

- Split `templates.ts` into 4 focused modules: `scan-template.ts`, `report-template.ts`, `migrate-template.ts`, and `template-helpers.ts`
- Each template generator becomes its own file with a single responsibility
- Shared formatting functions (date, project name, dependency table, tree, mermaid, large files) move to helpers
- All existing public API signatures remain identical — commands import from new paths
- Update commands (scan.ts, report.ts, migrate.ts) to import from new modules

## Capabilities

### New Capabilities

- `template-modules`: Decomposed template generation with one file per report type and shared helpers

### Modified Capabilities

## Impact

- `src/analysis/templates.ts` — deleted, replaced by 4 smaller files
- `src/commands/scan.ts` — import path changes
- `src/commands/report.ts` — import path changes
- `src/commands/migrate.ts` — import path changes
- Tests may need import path updates
- No behavioral changes — output is identical
