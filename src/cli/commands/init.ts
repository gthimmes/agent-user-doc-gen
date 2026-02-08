import { copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ensureDir, fileExists } from '../../utils/fs-helpers.js';
import { log } from '../../utils/logger.js';

export async function runInit(options: { config?: string }): Promise<void> {
  const configDir = 'config';
  const configPath = options.config ?? join(configDir, 'default.yaml');

  if (await fileExists(configPath)) {
    log.warn(`Config already exists at ${configPath}`);
    return;
  }

  const examplePath = join(configDir, 'examples', 'example-portal.yaml');
  if (await fileExists(examplePath)) {
    await ensureDir(configDir);
    await copyFile(examplePath, configPath);
    log.success(`Created config at ${configPath} from example`);
  } else {
    log.error('No example config found. Please create config/default.yaml manually.');
  }

  // Ensure capture and output directories exist
  await ensureDir('.captures');
  await ensureDir('output');

  log.info('Project initialized. Edit config/default.yaml to configure.');
}
