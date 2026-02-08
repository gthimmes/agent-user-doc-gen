import type { AgentBrowser } from './agent.js';
import { sleep } from '../utils/retry.js';
import { log } from '../utils/logger.js';

/**
 * Navigate to a URL and wait for the page to settle.
 */
export async function navigateAndWait(
  browser: AgentBrowser,
  url: string,
  waitMs = 2000,
): Promise<void> {
  await browser.navigate(url);
  await sleep(waitMs);
}

/**
 * Navigate to a path relative to a base URL.
 */
export async function navigateToPath(
  browser: AgentBrowser,
  baseUrl: string,
  path: string,
  waitMs = 2000,
): Promise<void> {
  const url = new URL(path, baseUrl).toString();
  await navigateAndWait(browser, url, waitMs);
}

/**
 * Take a full-page screenshot and return the path.
 */
export async function captureScreenshot(
  browser: AgentBrowser,
  outputPath: string,
): Promise<string> {
  await browser.screenshot(outputPath);
  return outputPath;
}

/**
 * Take a snapshot after ensuring the page has loaded.
 */
export async function captureSnapshot(
  browser: AgentBrowser,
  interactive = true,
  waitMs = 500,
): Promise<string> {
  await sleep(waitMs);
  const result = await browser.snapshot(interactive);
  return result.raw;
}

/**
 * Click a UI element by ref and wait for the result.
 */
export async function clickAndWait(
  browser: AgentBrowser,
  ref: string,
  waitMs = 2000,
): Promise<void> {
  await browser.click(ref);
  await sleep(waitMs);
}

/**
 * Fill a form field and optionally move to the next field.
 */
export async function fillField(
  browser: AgentBrowser,
  ref: string,
  value: string,
): Promise<void> {
  await browser.fill(ref, value);
  await sleep(300);
}

/**
 * Scroll down and capture more content if the page is long.
 */
export async function scrollAndCapture(
  browser: AgentBrowser,
  direction: 'up' | 'down' = 'down',
  times = 1,
  delayMs = 500,
): Promise<string[]> {
  const snapshots: string[] = [];
  for (let i = 0; i < times; i++) {
    await browser.scroll(direction);
    await sleep(delayMs);
    const snap = await browser.snapshot(true);
    snapshots.push(snap.raw);
  }
  return snapshots;
}

/**
 * Get the current page URL from the browser.
 */
export function getCurrentUrl(browser: AgentBrowser): string {
  return browser.getCurrentUrl();
}
