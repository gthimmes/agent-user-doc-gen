import { join } from 'node:path';
import type { DocGenConfig } from '../../types/config.js';
import type { PageCapture } from '../../types/capture.js';
import type { WorkflowRecording } from '../../types/workflow.js';
import { generateDocumentation } from '../../generator/doc-generator.js';
import { prepareForManualGeneration } from '../../generator/manual-prep.js';
import { assembleOutput } from '../../output/assembler.js';
import { readJson, listFiles } from '../../utils/fs-helpers.js';
import { log } from '../../utils/logger.js';

export async function runGenerate(
  config: DocGenConfig,
  options: { manual?: boolean } = {},
): Promise<void> {
  const captureDir = config.capture.captureDir;

  // Load page captures
  const captures = await loadCaptures(captureDir);
  if (captures.length === 0) {
    log.error('No captures found. Run "docgen capture" first.');
    return;
  }
  log.info(`Loaded ${captures.length} page captures`);

  // Load workflow recordings
  const recordings = await loadRecordings(captureDir);
  log.info(`Loaded ${recordings.length} workflow recordings`);

  if (options.manual) {
    // Manual mode: prepare data for Claude Code to process
    log.info('Preparing captures for Claude Code (manual mode)...');
    await prepareForManualGeneration(captures, recordings, config.output, captureDir);
    return;
  }

  // API mode: use Anthropic API (requires ANTHROPIC_API_KEY)
  if (!process.env.ANTHROPIC_API_KEY) {
    log.error('ANTHROPIC_API_KEY not set. Use --manual mode to generate with Claude Code instead.');
    log.info('  npx tsx src/index.ts generate --manual');
    return;
  }

  log.info('Generating documentation via Claude API...');
  const bundle = await generateDocumentation(
    captures,
    recordings,
    config.generation,
    config.output,
  );

  await assembleOutput(bundle, config.output);
  log.success(`Documentation generated: ${bundle.pages.length} pages in ${config.output.dir}/`);
}

async function loadCaptures(captureDir: string): Promise<PageCapture[]> {
  const pagesDir = join(captureDir, 'pages');
  const captures: PageCapture[] = [];
  const files = await listFiles(pagesDir, '.json');
  for (const file of files) {
    try {
      captures.push(await readJson<PageCapture>(file));
    } catch (error) {
      log.warn(`Failed to load capture ${file}: ${error}`);
    }
  }
  return captures;
}

async function loadRecordings(captureDir: string): Promise<WorkflowRecording[]> {
  const workflowsDir = join(captureDir, 'workflows');
  const recordings: WorkflowRecording[] = [];
  const files = await listFiles(workflowsDir, '.json');
  for (const file of files) {
    try {
      recordings.push(await readJson<WorkflowRecording>(file));
    } catch (error) {
      log.warn(`Failed to load recording ${file}: ${error}`);
    }
  }
  return recordings;
}
