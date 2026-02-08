import type { DocGenConfig } from '../../types/config.js';
import { runCrawl } from './crawl.js';
import { runCapture } from './capture.js';
import { runRecord } from './record.js';
import { runGenerate } from './generate.js';
import { log } from '../../utils/logger.js';

/**
 * Full pipeline: crawl -> capture -> record -> generate
 */
export async function runFull(config: DocGenConfig): Promise<void> {
  log.info('Running full documentation pipeline...');
  const start = Date.now();

  // Step 1: Crawl
  log.info('--- Step 1/4: Crawling ---');
  await runCrawl(config);

  // Step 2: Capture
  log.info('--- Step 2/4: Capturing ---');
  await runCapture(config, { all: true });

  // Step 3: Record workflows (if any defined)
  if (config.workflows.length > 0) {
    log.info('--- Step 3/4: Recording workflows ---');
    await runRecord(config, { all: true });
  } else {
    log.info('--- Step 3/4: No workflows defined, skipping ---');
  }

  // Step 4: Generate docs
  log.info('--- Step 4/4: Generating documentation ---');
  await runGenerate(config);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  log.success(`Full pipeline complete in ${elapsed}s`);
}
