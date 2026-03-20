import chalk from "chalk";
import { createInterface } from "node:readline";

export function success(message: string): void {
  process.stdout.write(`${chalk.green("\u2713")} ${message}\n`);
}

export function warn(message: string): void {
  process.stdout.write(`${chalk.yellow("\u26A0")} ${message}\n`);
}

export function error(message: string): void {
  process.stderr.write(`${chalk.red("\u2717")} ${message}\n`);
}

export function info(message: string): void {
  process.stdout.write(`${chalk.blue("\u2192")} ${message}\n`);
}

export function heading(message: string): void {
  process.stdout.write(`\n${chalk.bold(message)}\n`);
}

export async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${chalk.yellow("?")} ${message} ${chalk.dim("(y/n)")} `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}
