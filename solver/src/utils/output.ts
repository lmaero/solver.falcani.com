import chalk from "chalk";

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
