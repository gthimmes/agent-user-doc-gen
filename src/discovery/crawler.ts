import type { DiscoveryConfig } from '../types/config.js';
import type { Sitemap } from '../types/capture.js';
import type { AgentBrowser } from '../browser/agent.js';
import { parseSnapshot, extractLinks, extractTitle } from '../browser/parser.js';
import { navigateAndWait } from '../browser/actions.js';
import { createSitemap, addPage, hasPage } from './sitemap.js';
import { classifyPage } from './classifier.js';
import { log } from '../utils/logger.js';
import { sleep } from '../utils/retry.js';

interface CrawlQueueItem {
  path: string;
  depth: number;
  parent?: string;
}

/**
 * BFS crawler that discovers pages using agent-browser.
 */
export async function crawlSite(
  browser: AgentBrowser,
  baseUrl: string,
  config: DiscoveryConfig,
): Promise<Sitemap> {
  const sitemap = createSitemap(baseUrl);
  const queue: CrawlQueueItem[] = config.startPaths.map((p) => ({ path: p, depth: 0 }));
  const visited = new Set<string>();

  log.info(`Starting crawl from ${config.startPaths.join(', ')}`);
  log.info(`Max depth: ${config.maxDepth}, Max pages: ${config.maxPages}`);

  while (queue.length > 0 && sitemap.pages.length < config.maxPages) {
    const item = queue.shift()!;
    const normalizedPath = normalizePath(item.path);

    if (visited.has(normalizedPath)) continue;
    if (item.depth > config.maxDepth) continue;
    if (!matchesPatterns(normalizedPath, config.includePatterns, config.excludePatterns)) {
      log.debug(`Skipping ${normalizedPath} (excluded by patterns)`);
      continue;
    }

    visited.add(normalizedPath);
    log.step(`Crawling [${sitemap.pages.length + 1}/${config.maxPages}] ${normalizedPath} (depth ${item.depth})`);

    try {
      const url = new URL(normalizedPath, baseUrl).toString();
      await navigateAndWait(browser, url, config.waitAfterNavigation);

      const snapshot = await browser.snapshot(true);
      const elements = parseSnapshot(snapshot.raw);
      const title = extractTitle(snapshot.raw);
      const links = extractLinks(elements, baseUrl);
      const classification = classifyPage(normalizedPath, elements, snapshot.raw);

      const internalLinkPaths = links
        .filter((l) => l.isInternal)
        .map((l) => {
          try {
            return new URL(l.href, baseUrl).pathname;
          } catch {
            return l.href;
          }
        });

      addPage(sitemap, {
        url,
        path: normalizedPath,
        title,
        classification,
        depth: item.depth,
        parent: item.parent,
        links: internalLinkPaths,
      });

      // Enqueue discovered links
      for (const linkPath of internalLinkPaths) {
        if (!visited.has(normalizePath(linkPath)) && !hasPage(sitemap, normalizePath(linkPath))) {
          queue.push({
            path: linkPath,
            depth: item.depth + 1,
            parent: normalizedPath,
          });
        }
      }
    } catch (error) {
      log.warn(`Failed to crawl ${normalizedPath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  log.success(`Crawl complete: ${sitemap.pages.length} pages discovered`);
  return sitemap;
}

function normalizePath(path: string): string {
  return path.replace(/\/+$/, '') || '/';
}

function matchesPatterns(path: string, includes: string[], excludes: string[]): boolean {
  const matchesGlob = (pattern: string, value: string): boolean => {
    // Simple glob matching: ** matches any path, * matches any segment
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*');
    return new RegExp(`^${regex}$`).test(value);
  };

  // Must match at least one include pattern
  const included = includes.length === 0 || includes.some((p) => matchesGlob(p, path));
  if (!included) return false;

  // Must not match any exclude pattern
  const excluded = excludes.some((p) => matchesGlob(p, path));
  return !excluded;
}
