#!/usr/bin/env node
import { Command } from "commander";
import { executeAudit } from "./commands/audit.js";
import { executeDoctor } from "./commands/doctor.js";
import { executeInit } from "./commands/init.js";
import { executeMigrate } from "./commands/migrate.js";
import { executeReport } from "./commands/report.js";
import { executeScan } from "./commands/scan.js";
import { executeUninstall } from "./commands/uninstall.js";
import { executeUpdate } from "./commands/update.js";

const program = new Command();

program
  .name("solver")
  .description(
    "falcani solver framework — pattern authority for AI-assisted development",
  )
  .version("0.1.0");

program
  .command("init")
  .description("Scaffold solver framework into the current project")
  .option("--ecosystem <type>", "Ecosystem tooling pack (ts|cpp)", "ts")
  .action(async (options) => {
    await executeInit(process.cwd(), { ecosystem: options.ecosystem });
  });

program
  .command("doctor")
  .description("Check solver framework installation health")
  .action(async () => {
    const report = await executeDoctor(process.cwd());
    if (!report.healthy) {
      process.exitCode = 1;
    }
  });

program
  .command("uninstall")
  .description("Remove solver framework files from the current project")
  .action(async () => {
    await executeUninstall(process.cwd());
  });

program
  .command("update")
  .description("Compare framework files against current templates")
  .option("--ecosystem <type>", "Ecosystem tooling pack (ts|cpp)", "ts")
  .action(async (options) => {
    const diffs = await executeUpdate(process.cwd(), {
      ecosystem: options.ecosystem,
    });
    const hasIssues = diffs.some(
      (d) => d.status === "differs" || d.status === "missing",
    );
    if (hasIssues) {
      process.exitCode = 1;
    }
  });

program
  .command("audit")
  .description("Run phase completion checks and display scorecard")
  .action(async () => {
    await executeAudit(process.cwd());
  });

program
  .command("scan")
  .description("Analyze codebase and generate scan report")
  .action(async () => {
    await executeScan(process.cwd());
  });

program
  .command("report")
  .description("Generate a structured field report")
  .action(async () => {
    await executeReport(process.cwd());
  });

program
  .command("migrate")
  .description("Generate migration assessment for existing codebase")
  .action(async () => {
    await executeMigrate(process.cwd());
  });

program.parse();
