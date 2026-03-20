## Context

`src/analysis/templates.ts` contains three template generators (`generateScanTemplate`, `generateReportTemplate`, `generateMigrateTemplate`) plus 8 shared formatting helpers. At 513 lines, it's the only file in the project exceeding the 400-line threshold. The file was created in one pass when implementing all analysis commands together, so the three generators were never separated.

## Goals / Non-Goals

**Goals:**
- Every file under 400 lines after the split
- Zero behavioral changes — output from scan, report, and migrate is byte-identical
- All 159 tests continue to pass without modification (or minimal import path fixes)

**Non-Goals:**
- Improving template content or formatting (separate change)
- Adding new templates
- Refactoring the collector or scorecard modules

## Decisions

**Split into 4 files, not 3.** Shared helpers (formatDate, formatProjectName, formatDependencyTable, formatDirectoryTree, generateMermaidDiagram, formatLargeFilesList, formatInfrastructureStatus, generateFindings) go into `template-helpers.ts`. Each template generator goes into its own file. This avoids duplication while keeping each file focused.

Alternative considered: 3 files (one per template, each duplicating helpers). Rejected because the helpers are identical across templates and would drift.

**Keep all files in `src/analysis/`.** No new directories. The templates are part of the analysis module, not a separate concern.

Alternative considered: `src/templates/analysis/`. Rejected because it would create a confusing parallel to `src/templates/` (which holds the skill and init templates).

**Re-export from an index.** Create `src/analysis/templates/index.ts` that re-exports all three generators. This way, existing imports `from "../analysis/templates.js"` in commands continue to work without changes.

Wait — this changes the file structure. Simpler approach: rename `templates.ts` to `templates/index.ts` and split. Or just update the 3 import paths in the 3 command files. Updating 3 imports is simpler than creating a re-export layer.

**Final decision:** 4 separate files in `src/analysis/`, update 3 command imports. No index re-export.

## Risks / Trade-offs

- [Import paths change] → Only 3 files affected (scan.ts, report.ts, migrate.ts). Mechanical change.
- [Test imports might break] → Tests import commands, not templates directly. No test changes expected.
