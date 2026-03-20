## 1. Extract shared helpers

- [x] 1.1 Create `src/analysis/template-helpers.ts` with all shared formatting functions: `formatDate`, `formatProjectName`, `formatDependencyTable`, `formatDirectoryTree`, `generateMermaidDiagram`, `formatLargeFilesList`, `formatInfrastructureStatus`, `generateFindings`
- [x] 1.2 Verify `template-helpers.ts` is under 200 lines

## 2. Extract template generators

- [x] 2.1 Create `src/analysis/scan-template.ts` with `generateScanTemplate` importing helpers from `template-helpers.ts`
- [x] 2.2 Create `src/analysis/report-template.ts` with `generateReportTemplate` importing helpers from `template-helpers.ts`
- [x] 2.3 Create `src/analysis/migrate-template.ts` with `generateMigrateTemplate` importing helpers from `template-helpers.ts`
- [x] 2.4 Verify each template file is under 200 lines

## 3. Update imports and delete original

- [x] 3.1 Update `src/commands/scan.ts` to import from `../analysis/scan-template.js`
- [x] 3.2 Update `src/commands/report.ts` to import from `../analysis/report-template.js`
- [x] 3.3 Update `src/commands/migrate.ts` to import from `../analysis/migrate-template.js`
- [x] 3.4 Delete `src/analysis/templates.ts`

## 4. Verify

- [x] 4.1 Run `pnpm build` — zero TypeScript errors
- [x] 4.2 Run `pnpm test:run` — all 159 tests pass
- [x] 4.3 Run `node dist/index.js audit` — zero files over 400 lines in `src/analysis/`
- [x] 4.4 Commit: `refactor: split templates.ts into focused modules`
