import express from 'express';
import { join, resolve } from 'node:path';
import type { DocGenConfig } from '../../types/config.js';
import { fileExists } from '../../utils/fs-helpers.js';
import { log } from '../../utils/logger.js';

export async function runServe(
  config: DocGenConfig,
  options: { port?: number },
): Promise<void> {
  const port = options.port ?? 3000;
  const htmlDir = resolve(join(config.output.dir, 'html'));

  if (!(await fileExists(htmlDir))) {
    log.error(`HTML output not found at ${htmlDir}. Run "docgen generate" first.`);
    return;
  }

  const app = express();
  app.use(express.static(htmlDir));

  // Serve index.html as default
  app.get('/', (_req, res) => {
    res.sendFile(join(htmlDir, 'index.html'));
  });

  app.listen(port, () => {
    log.success(`Documentation server running at http://localhost:${port}`);
    log.info('Press Ctrl+C to stop');
  });
}
