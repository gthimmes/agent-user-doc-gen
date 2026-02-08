import type { DocGenConfig } from '../../types/config.js';
import { AgentBrowser } from '../../browser/agent.js';
import { BrowserSession } from '../../browser/session.js';
import { crawlSite } from '../../discovery/crawler.js';
import { saveSitemap } from '../../discovery/sitemap.js';
import { ensureDir } from '../../utils/fs-helpers.js';
import { log } from '../../utils/logger.js';

export async function runCrawl(config: DocGenConfig): Promise<void> {
  log.info(`Crawling ${config.portal.name} at ${config.portal.baseUrl}`);

  await ensureDir(config.capture.captureDir);

  const browser = new AgentBrowser();
  const session = new BrowserSession(browser, config.auth);

  try {
    // Authenticate first
    await session.ensureAuthenticated(config.portal.baseUrl);

    // Crawl the site
    const sitemap = await crawlSite(browser, config.portal.baseUrl, config.discovery);

    // Save sitemap
    const path = await saveSitemap(sitemap, config.capture.captureDir);
    log.success(`Sitemap saved to ${path} (${sitemap.pages.length} pages)`);
  } finally {
    await browser.close();
  }
}
