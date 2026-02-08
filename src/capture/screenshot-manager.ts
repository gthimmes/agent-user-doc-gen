import { join } from 'node:path';
import { ensureDir, fileExists } from '../utils/fs-helpers.js';
import { pathToSlug, screenshotFilename } from '../utils/slug.js';

export class ScreenshotManager {
  private captureDir: string;
  private screenshotDir: string;
  private counter = 0;

  constructor(captureDir: string) {
    this.captureDir = captureDir;
    this.screenshotDir = join(captureDir, 'screenshots');
  }

  async init(): Promise<void> {
    await ensureDir(this.screenshotDir);
  }

  /**
   * Get a unique screenshot path for a page.
   */
  pageScreenshotPath(pagePath: string): string {
    const slug = pathToSlug(pagePath) || 'index';
    return join(this.screenshotDir, `${slug}.png`);
  }

  /**
   * Get a screenshot path for a section within a page.
   */
  sectionScreenshotPath(pagePath: string, sectionName: string): string {
    const slug = pathToSlug(pagePath) || 'index';
    const sectionSlug = pathToSlug(sectionName);
    return join(this.screenshotDir, `${slug}-${sectionSlug}.png`);
  }

  /**
   * Get a screenshot path for a workflow step.
   */
  workflowStepPath(workflowId: string, stepIndex: number): string {
    return join(this.screenshotDir, screenshotFilename(workflowId, stepIndex));
  }

  /**
   * Get a sequentially numbered screenshot path.
   */
  nextScreenshotPath(prefix: string): string {
    this.counter++;
    return join(this.screenshotDir, screenshotFilename(prefix, this.counter));
  }

  getScreenshotDir(): string {
    return this.screenshotDir;
  }

  getCaptureDir(): string {
    return this.captureDir;
  }
}
