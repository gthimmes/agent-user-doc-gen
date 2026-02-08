import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel];
}

function timestamp(): string {
  return new Date().toISOString().slice(11, 23);
}

export const log = {
  debug(msg: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.log(chalk.gray(`[${timestamp()}] DBG`), msg, ...args);
    }
  },
  info(msg: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.log(chalk.blue(`[${timestamp()}] INF`), msg, ...args);
    }
  },
  warn(msg: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(chalk.yellow(`[${timestamp()}] WRN`), msg, ...args);
    }
  },
  error(msg: string, ...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(chalk.red(`[${timestamp()}] ERR`), msg, ...args);
    }
  },
  success(msg: string, ...args: unknown[]): void {
    console.log(chalk.green(`[${timestamp()}]  OK`), msg, ...args);
  },
  step(msg: string): void {
    console.log(chalk.cyan(`  -> ${msg}`));
  },
};
