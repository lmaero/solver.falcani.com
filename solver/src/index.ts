#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("solver")
  .description("falcani solver framework — pattern authority for AI-assisted development")
  .version("0.1.0");

program.parse();
