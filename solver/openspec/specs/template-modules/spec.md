# template-modules Specification

## Purpose
TBD - created by archiving change split-templates-module. Update Purpose after archive.
## Requirements
### Requirement: Each template generator lives in its own file
The system SHALL have one file per report template: `scan-template.ts`, `report-template.ts`, `migrate-template.ts`, and `template-helpers.ts` for shared formatting functions. No single file SHALL exceed 400 lines.

#### Scenario: File count after split
- **WHEN** the split is complete
- **THEN** `src/analysis/templates.ts` no longer exists and 4 new files exist in `src/analysis/`

#### Scenario: No file exceeds threshold
- **WHEN** `solver audit` runs after the split
- **THEN** zero files are reported over 400 lines in `src/analysis/`

### Requirement: Output is byte-identical
The system SHALL produce identical markdown output from `solver scan`, `solver report`, and `solver migrate` before and after the split.

#### Scenario: Scan output unchanged
- **WHEN** `solver scan` runs on the same project before and after the split
- **THEN** the generated markdown content is identical (excluding the date if it changes)

#### Scenario: Report output unchanged
- **WHEN** `solver report` runs on the same project before and after the split
- **THEN** the generated markdown content is identical

#### Scenario: Migrate output unchanged
- **WHEN** `solver migrate` runs on the same project before and after the split
- **THEN** the generated markdown content is identical

### Requirement: All existing tests pass without modification
The system SHALL maintain all 159 existing tests passing. Test files SHALL NOT require import path changes since they import commands, not templates directly.

#### Scenario: Test suite passes
- **WHEN** `pnpm test:run` executes after the split
- **THEN** all 159 tests pass with zero failures

### Requirement: Commands import from new module paths
The scan, report, and migrate commands SHALL update their imports to reference the new file paths (`scan-template.ts`, `report-template.ts`, `migrate-template.ts`) instead of the deleted `templates.ts`.

#### Scenario: Commands resolve imports
- **WHEN** `pnpm build` runs after the split
- **THEN** TypeScript compilation succeeds with zero errors

