import type { DocGenConfig } from '../../types/config.js';
import type { PageCapture, SitemapEntry } from '../../types/capture.js';
import { AgentBrowser } from '../../browser/agent.js';
import { BrowserSession } from '../../browser/session.js';
import { ScreenshotManager } from '../../capture/screenshot-manager.js';
import { capturePage } from '../../capture/page-capturer.js';
import { createSitemap, addPage, saveSitemap } from '../../discovery/sitemap.js';
import { log } from '../../utils/logger.js';

/**
 * Direct capture strategy for SPAs with known routes.
 * Instead of crawling links, directly navigate to predefined routes.
 */
export async function captureDirectRoutes(
  config: DocGenConfig,
  routes: string[],
): Promise<void> {
  log.info(`Starting direct capture of ${routes.length} routes...`);

  const browser = new AgentBrowser({ headless: false });
  const session = new BrowserSession(browser, config.auth);
  const screenshotMgr = new ScreenshotManager(config.capture.captureDir);
  await screenshotMgr.init();

  const sitemap = createSitemap(config.portal.baseUrl);
  const captures: PageCapture[] = [];

  try {
    // Authenticate once
    await session.ensureAuthenticated(config.portal.baseUrl);

    // Capture each route directly
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      log.step(`[${i + 1}/${routes.length}] Capturing ${route}`);

      try {
        const url = new URL(route, config.portal.baseUrl).toString();
        await browser.navigate(url);
        await browser.wait(config.discovery.waitAfterNavigation);

        // Take snapshot to get page info
        const snapshot = await browser.snapshot(true);
        const { parseSnapshot, extractTitle } = await import('../../browser/parser.js');
        const elements = parseSnapshot(snapshot.raw);
        const title = extractTitle(snapshot.raw) || route;
        const { classifyPage } = await import('../../discovery/classifier.js');
        const classification = classifyPage(route, elements, snapshot.raw);

        // Create sitemap entry
        const entry: SitemapEntry = {
          url,
          path: route,
          title,
          classification,
          depth: 0,
          links: [],
        };

        addPage(sitemap, entry);

        // Capture full page data
        const capture = await capturePage(
          browser,
          entry,
          config.portal.baseUrl,
          config.capture,
          screenshotMgr,
        );
        captures.push(capture);

        log.success(`Captured: ${title}`);
      } catch (error) {
        log.error(`Failed to capture ${route}: ${error instanceof Error ? error.message : error}`);
      }
    }

    // Save sitemap
    await saveSitemap(sitemap, config.capture.captureDir);
    log.success(`Sitemap saved: ${sitemap.pages.length} pages`);
  } finally {
    await browser.close();
  }

  log.success(`Direct capture complete: ${captures.length}/${routes.length} pages captured`);
}
