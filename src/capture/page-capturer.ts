import { join } from 'node:path';
import type { PageCapture, SectionCapture } from '../types/capture.js';
import type { CaptureConfig, SectionConfig } from '../types/config.js';
import type { SitemapEntry } from '../types/capture.js';
import type { AgentBrowser } from '../browser/agent.js';
import { parseSnapshot, extractLinks, extractTitle } from '../browser/parser.js';
import { navigateAndWait, captureScreenshot } from '../browser/actions.js';
import { captureSection } from './section-capturer.js';
import { ScreenshotManager } from './screenshot-manager.js';
import { writeJson } from '../utils/fs-helpers.js';
import { log } from '../utils/logger.js';

/**
 * Capture full page data: screenshot, snapshot text, elements, links, sections.
 */
export async function capturePage(
  browser: AgentBrowser,
  entry: SitemapEntry,
  baseUrl: string,
  captureConfig: CaptureConfig,
  screenshotMgr: ScreenshotManager,
): Promise<PageCapture> {
  log.step(`Capturing page: ${entry.path}`);

  // Navigate to the page
  await navigateAndWait(browser, entry.url, 2000);

  // Take screenshot
  const screenshotPath = screenshotMgr.pageScreenshotPath(entry.path);
  await captureScreenshot(browser, screenshotPath);

  // Take snapshot
  const snapshot = await browser.snapshot(true);
  const elements = parseSnapshot(snapshot.raw);
  const links = extractLinks(elements, baseUrl);
  const title = extractTitle(snapshot.raw) || entry.title;

  // Capture configured sections
  const sections: SectionCapture[] = [];
  if (captureConfig.sections) {
    for (const sectionConfig of captureConfig.sections) {
      const sectionScreenshotPath = screenshotMgr.sectionScreenshotPath(
        entry.path,
        sectionConfig.name,
      );
      const section = await captureSection(browser, sectionConfig, sectionScreenshotPath);
      sections.push(section);
    }
  }

  const capture: PageCapture = {
    url: entry.url,
    path: entry.path,
    title,
    timestamp: new Date().toISOString(),
    screenshotPath,
    snapshotText: snapshot.raw,
    elements,
    links,
    sections,
    classification: entry.classification,
    metadata: {},
  };

  // Save capture data as JSON
  const captureJsonPath = join(
    screenshotMgr.getCaptureDir(),
    'pages',
    `${entry.path.replace(/\//g, '_').replace(/^_/, '') || 'index'}.json`,
  );
  await writeJson(captureJsonPath, capture);
  log.debug(`Capture saved to ${captureJsonPath}`);

  return capture;
}

/**
 * Capture all pages in a sitemap.
 */
export async function captureAllPages(
  browser: AgentBrowser,
  pages: SitemapEntry[],
  baseUrl: string,
  captureConfig: CaptureConfig,
): Promise<PageCapture[]> {
  const screenshotMgr = new ScreenshotManager(captureConfig.captureDir);
  await screenshotMgr.init();

  const captures: PageCapture[] = [];

  for (let i = 0; i < pages.length; i++) {
    log.info(`[${i + 1}/${pages.length}] Capturing ${pages[i].path}`);
    try {
      const capture = await capturePage(browser, pages[i], baseUrl, captureConfig, screenshotMgr);
      captures.push(capture);
    } catch (error) {
      log.error(`Failed to capture ${pages[i].path}: ${error instanceof Error ? error.message : error}`);
    }
  }

  log.success(`Captured ${captures.length}/${pages.length} pages`);
  return captures;
}
