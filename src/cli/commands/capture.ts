import type { DocGenConfig } from '../../types/config.js';
import { AgentBrowser } from '../../browser/agent.js';
import { BrowserSession } from '../../browser/session.js';
import { loadSitemap } from '../../discovery/sitemap.js';
import { captureAllPages } from '../../capture/page-capturer.js';
import { writeJson } from '../../utils/fs-helpers.js';
import { log } from '../../utils/logger.js';
import { join } from 'node:path';

export async function runCapture(config: DocGenConfig, options: { all?: boolean; pages?: string[] }): Promise<void> {
  log.info('Starting page capture...');

  const sitemap = await loadSitemap(config.capture.captureDir);
  let pages = sitemap.pages;

  // Filter to specific pages if requested
  if (options.pages && options.pages.length > 0) {
    pages = pages.filter((p) => options.pages!.some((target) => p.path.includes(target)));
    log.info(`Capturing ${pages.length} filtered pages`);
  } else if (options.all) {
    log.info(`Capturing all ${pages.length} pages`);
  } else {
    log.info(`Capturing all ${pages.length} pages (use --pages to filter)`);
  }

  const browser = new AgentBrowser();
  const session = new BrowserSession(browser, config.auth);

  try {
    await session.ensureAuthenticated(config.portal.baseUrl);

    const captures = await captureAllPages(
      browser,
      pages,
      config.portal.baseUrl,
      config.capture,
    );

    // Save captures manifest
    const manifestPath = join(config.capture.captureDir, 'captures.json');
    await writeJson(manifestPath, {
      capturedAt: new Date().toISOString(),
      count: captures.length,
      pages: captures.map((c) => ({
        path: c.path,
        title: c.title,
        classification: c.classification,
        screenshotPath: c.screenshotPath,
      })),
    });

    log.success(`Captured ${captures.length} pages. Manifest: ${manifestPath}`);
  } finally {
    await browser.close();
  }
}
