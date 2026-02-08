import yaml from 'js-yaml';
import { readText, fileExists } from '../utils/fs-helpers.js';
import { docGenConfigSchema } from './schema.js';
import type { DocGenConfig } from '../types/config.js';
import { log } from '../utils/logger.js';

export async function loadConfig(configPath: string): Promise<DocGenConfig> {
  if (!(await fileExists(configPath))) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  log.info(`Loading config from ${configPath}`);
  const raw = await readText(configPath);
  const parsed = yaml.load(raw);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Invalid YAML in config file: ${configPath}`);
  }

  const result = docGenConfigSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Config validation failed:\n${errors}`);
  }

  return result.data as DocGenConfig;
}

export function resolveConfigPath(explicit?: string): string {
  if (explicit) return explicit;
  return 'config/default.yaml';
}
