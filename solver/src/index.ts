#!/usr/bin/env node
import { Command } from "commander";
import { executeInit } from "./commands/init.js";
import { executeDoctor } from "./commands/doctor.js";

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

program.parse();
