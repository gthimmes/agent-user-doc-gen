#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig, resolveConfigPath } from './config/loader.js';
import { setLogLevel } from './utils/logger.js';
import { log } from './utils/logger.js';
import { runInit } from './cli/commands/init.js';
import { runAuth } from './cli/commands/auth.js';
import { runCrawl } from './cli/commands/crawl.js';
import { runCapture } from './cli/commands/capture.js';
import { runRecord } from './cli/commands/record.js';
import { runGenerate } from './cli/commands/generate.js';
import { runServe } from './cli/commands/serve.js';
import { runFull } from './cli/commands/full.js';

const program = new Command();

program
  .name('docgen')
  .description('Automated user documentation generator using agent-browser and Claude')
  .version('0.1.0')
  .option('-c, --config <path>', 'Path to config file')
  .option('-v, --verbose', 'Enable verbose logging');

program
  .command('init')
  .description('Create config from template')
  .action(async () => {
    await runInit({ config: program.opts().config });
  });

program
  .command('auth')
  .description('Login and save authentication state')
  .action(async () => {
    const config = await loadConfig(resolveConfigPath(program.opts().config));
    await runAuth(config);
  });

program
  .command('crawl')
  .description('Discover pages and build sitemap')
  .action(async () => {
    const config = await loadConfig(resolveConfigPath(program.opts().config));
    await runCrawl(config);
  });

program
  .command('capture')
  .description('Capture pages (screenshots + text)')
  .option('-a, --all', 'Capture all discovered pages')
  .option('-p, --pages <paths...>', 'Specific page paths to capture')
  .action(async (options) => {
    const config = await loadConfig(resolveConfigPath(program.opts().config));
    await runCapture(config, options);
  });

program
  .command('record')
  .description('Record defined workflows')
  .option('-a, --all', 'Record all workflows')
  .option('-w, --workflow <id>', 'Record a specific workflow by ID')
  .action(async (options) => {
    const config = await loadConfig(resolveConfigPath(program.opts().config));
    await runRecord(config, options);
  });

program
  .command('generate')
  .description('Generate docs from captures')
  .option('-m, --manual', 'Prepare data for Claude Code instead of calling API (no API key needed)')
  .action(async (options) => {
    const config = await loadConfig(resolveConfigPath(program.opts().config));
    await runGenerate(config, options);
  });

program
  .command('serve')
  .description('Preview generated HTML docs')
  .option('-p, --port <number>', 'Port number', '3000')
  .action(async (options) => {
    const config = await loadConfig(resolveConfigPath(program.opts().config));
    await runServe(config, { port: parseInt(options.port, 10) });
  });

program
  .command('run')
  .description('Full pipeline: crawl -> capture -> record -> generate')
  .action(async () => {
    const config = await loadConfig(resolveConfigPath(program.opts().config));
    await runFull(config);
  });

// Set log level before running
program.hook('preAction', () => {
  if (program.opts().verbose) {
    setLogLevel('debug');
  }
});

program.parseAsync(process.argv).catch((error) => {
  log.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
