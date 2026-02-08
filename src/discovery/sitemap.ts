import type { Sitemap, SitemapEntry, PageClassification } from '../types/capture.js';
import { writeJson, readJson, fileExists } from '../utils/fs-helpers.js';
import { join } from 'node:path';

export function createSitemap(baseUrl: string): Sitemap {
  return {
    baseUrl,
    capturedAt: new Date().toISOString(),
    pages: [],
  };
}

export function addPage(
  sitemap: Sitemap,
  entry: Omit<SitemapEntry, 'links'> & { links?: string[] },
): void {
  const existing = sitemap.pages.find((p) => p.path === entry.path);
  if (existing) return;
  sitemap.pages.push({ ...entry, links: entry.links ?? [] });
}

export function hasPage(sitemap: Sitemap, path: string): boolean {
  return sitemap.pages.some((p) => p.path === path);
}

export function getPage(sitemap: Sitemap, path: string): SitemapEntry | undefined {
  return sitemap.pages.find((p) => p.path === path);
}

export async function saveSitemap(sitemap: Sitemap, captureDir: string): Promise<string> {
  const path = join(captureDir, 'sitemap.json');
  await writeJson(path, sitemap);
  return path;
}

export async function loadSitemap(captureDir: string): Promise<Sitemap> {
  const path = join(captureDir, 'sitemap.json');
  if (!(await fileExists(path))) {
    throw new Error(`Sitemap not found at ${path}. Run 'docgen crawl' first.`);
  }
  return readJson<Sitemap>(path);
}
