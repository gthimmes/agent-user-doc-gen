import type { SectionCapture, ElementInfo } from '../types/capture.js';
import type { SectionConfig } from '../types/config.js';
import type { AgentBrowser } from '../browser/agent.js';
import { parseSnapshot } from '../browser/parser.js';
import { log } from '../utils/logger.js';

/**
 * Capture a specific section of a page by CSS selector.
 *
 * Note: agent-browser doesn't have native section-scoped capture,
 * so we take a full snapshot and filter elements that appear within
 * the section context. Screenshots are full-page.
 */
export async function captureSection(
  browser: AgentBrowser,
  sectionConfig: SectionConfig,
  screenshotPath?: string,
): Promise<SectionCapture> {
  log.debug(`Capturing section: ${sectionConfig.name} (${sectionConfig.selector})`);

  // Take snapshot and try to find elements related to the section
  const snapshot = await browser.snapshot(true);
  const allElements = parseSnapshot(snapshot.raw);

  // Filter elements that might belong to this section
  // This is a heuristic since we can't scope snapshot by selector directly
  const sectionElements = filterSectionElements(allElements, sectionConfig.selector);

  if (screenshotPath) {
    try {
      await browser.screenshot(screenshotPath);
    } catch (err) {
      log.warn(`Could not screenshot section ${sectionConfig.name}: ${err}`);
    }
  }

  return {
    name: sectionConfig.name,
    selector: sectionConfig.selector,
    screenshotPath,
    text: sectionElements.map((e) => e.text).filter(Boolean).join('\n'),
    elements: sectionElements,
  };
}

function filterSectionElements(elements: ElementInfo[], selector: string): ElementInfo[] {
  // Simple heuristic: if selector is a tag name like 'nav', 'main', 'header',
  // look for elements with that tag and nearby elements.
  const tagName = selector.replace(/[.#\[\]]/g, '').toLowerCase();

  // Find the section root element
  const rootIndex = elements.findIndex(
    (e) => e.tag.toLowerCase() === tagName || e.role?.toLowerCase() === tagName,
  );

  if (rootIndex === -1) {
    return [];
  }

  // Return the root and subsequent elements until we hit another major landmark
  const landmarks = new Set(['nav', 'main', 'header', 'footer', 'aside', 'section']);
  const result = [elements[rootIndex]];

  for (let i = rootIndex + 1; i < elements.length; i++) {
    if (landmarks.has(elements[i].tag.toLowerCase()) && i !== rootIndex) {
      break;
    }
    result.push(elements[i]);
  }

  return result;
}
