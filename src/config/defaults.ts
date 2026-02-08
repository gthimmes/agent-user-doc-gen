import type { DocGenConfig } from '../types/config.js';

export const DEFAULT_CONFIG: Omit<DocGenConfig, 'portal'> = {
  auth: {
    strategy: 'manual',
  },
  discovery: {
    startPaths: ['/'],
    maxDepth: 3,
    maxPages: 50,
    includePatterns: ['**'],
    excludePatterns: [],
    waitAfterNavigation: 2000,
  },
  capture: {
    screenshotFormat: 'png',
    screenshotQuality: 90,
    captureDir: '.captures',
  },
  workflows: [],
  generation: {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 4096,
    temperature: 0.3,
    docTypes: ['tutorial', 'reference'],
    includeScreenshots: true,
    language: 'en',
  },
  output: {
    dir: 'output',
    formats: ['markdown', 'html'],
    screenshotDir: 'screenshots',
    generateToc: true,
    generateIndex: true,
    siteName: 'Documentation',
  },
};
