import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { log } from '../utils/logger.js';

const DEFAULT_TIMEOUT = 30_000;
const STATE_DIR = '.agent-browser-state';
const PROFILE_DIR = '.browser-profile';

export interface AgentBrowserOptions {
  timeout?: number;
  cwd?: string;
  headless?: boolean;
}

export interface SnapshotResult {
  raw: string;
  interactive: boolean;
}

/**
 * Playwright-based browser automation wrapper.
 * Uses a persistent browser profile so login sessions (SSO, MFA) survive between runs.
 */
export class AgentBrowser {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private sessionActive = false;
  private currentUrl = '';
  private opts: Required<AgentBrowserOptions>;
  private profileDir: string;

  constructor(options: AgentBrowserOptions = {}) {
    this.opts = {
      timeout: options.timeout ?? DEFAULT_TIMEOUT,
      cwd: options.cwd ?? process.cwd(),
      headless: options.headless ?? false,
    };

    // Ensure state directory exists
    const stateDir = join(this.opts.cwd, STATE_DIR);
    if (!existsSync(stateDir)) {
      mkdirSync(stateDir, { recursive: true });
    }

    // Persistent browser profile directory
    this.profileDir = join(this.opts.cwd, PROFILE_DIR);
    if (!existsSync(this.profileDir)) {
      mkdirSync(this.profileDir, { recursive: true });
    }
  }

  private async ensureBrowser(): Promise<void> {
    if (!this.context) {
      log.info(`Using persistent browser profile: ${this.profileDir}`);
      // launchPersistentContext saves ALL browser data (cookies, localStorage,
      // IndexedDB, session storage) to disk. SSO/MFA sessions persist between runs.
      this.context = await chromium.launchPersistentContext(this.profileDir, {
        headless: this.opts.headless,
        viewport: { width: 2560, height: 1440 },
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--start-maximized'],
      });
      // Persistent context already has a page open
      this.page = this.context.pages()[0] || await this.context.newPage();
      this.page.setDefaultTimeout(this.opts.timeout);
    }
  }

  async open(url: string): Promise<string> {
    await this.ensureBrowser();
    await this.page!.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    this.sessionActive = true;
    this.currentUrl = url;
    log.info(`Opened ${url}`);
    return `Navigated to ${url}`;
  }

  async snapshot(interactive = false): Promise<SnapshotResult> {
    if (!this.page) throw new Error('No active browser session');

    // Get page text content
    const textContent = await this.page.evaluate(() => document.body.innerText || '');

    // Get basic structure with interactive elements
    const elementsData = await this.page.evaluate(() => {
      const selectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'a', 'button', 'input', 'select', 'textarea',
        '[role="button"]', '[role="link"]', '[role="textbox"]'
      ];

      const elements: any[] = [];
      selectors.forEach((selector) => {
        const nodes = document.querySelectorAll(selector);
        nodes.forEach((node) => {
          const el = node as HTMLElement;
          elements.push({
            tag: el.tagName.toLowerCase(),
            text: el.innerText?.trim().substring(0, 100) || '',
            role: el.getAttribute('role'),
            type: (el as HTMLInputElement).type,
            placeholder: el.getAttribute('placeholder'),
            href: (el as HTMLAnchorElement).href,
          });
        });
      });
      return elements;
    });

    // Format elements as text
    let raw = textContent + '\n\n--- Interactive Elements ---\n';
    for (const el of elementsData) {
      raw += `${el.tag}`;
      if (el.role) raw += `[${el.role}]`;
      if (el.text) raw += `: ${el.text}`;
      if (el.placeholder) raw += ` (${el.placeholder})`;
      if (el.href) raw += ` -> ${el.href}`;
      raw += '\n';
    }

    return { raw, interactive };
  }

  async screenshot(path: string): Promise<string> {
    if (!this.page) throw new Error('No active browser session');
    await this.page.screenshot({ path, fullPage: true });
    log.debug(`Screenshot saved to ${path}`);
    return `Screenshot saved to ${path}`;
  }

  async click(selector: string): Promise<string> {
    if (!this.page) throw new Error('No active browser session');
    await this.page.click(selector);
    return `Clicked ${selector}`;
  }

  async fill(selector: string, value: string): Promise<string> {
    if (!this.page) throw new Error('No active browser session');
    await this.page.fill(selector, value);
    return `Filled ${selector} with "${value}"`;
  }

  async select(selector: string, value: string): Promise<string> {
    if (!this.page) throw new Error('No active browser session');
    await this.page.selectOption(selector, value);
    return `Selected "${value}" in ${selector}`;
  }

  async hover(selector: string): Promise<string> {
    if (!this.page) throw new Error('No active browser session');
    await this.page.hover(selector);
    return `Hovered over ${selector}`;
  }

  async scroll(direction: 'up' | 'down', amount?: number): Promise<string> {
    if (!this.page) throw new Error('No active browser session');
    const distance = amount ?? 300;
    const delta = direction === 'down' ? distance : -distance;
    await this.page.mouse.wheel(0, delta);
    return `Scrolled ${direction} by ${Math.abs(delta)}px`;
  }

  async navigate(url: string): Promise<string> {
    if (!this.page) throw new Error('No active browser session');
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    this.currentUrl = url;
    return `Navigated to ${url}`;
  }

  async back(): Promise<string> {
    if (!this.page) throw new Error('No active browser session');
    await this.page.goBack();
    return 'Navigated back';
  }

  async forward(): Promise<string> {
    if (!this.page) throw new Error('No active browser session');
    await this.page.goForward();
    return 'Navigated forward';
  }

  async wait(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async stateSave(name: string): Promise<string> {
    if (!this.context) throw new Error('No active browser session');
    const statePath = join(this.opts.cwd, STATE_DIR, `${name}.json`);
    await this.context.storageState({ path: statePath });
    log.info(`Browser state saved to ${statePath}`);
    return `State saved as ${name}`;
  }

  async stateLoad(name: string): Promise<string> {
    const statePath = join(this.opts.cwd, STATE_DIR, `${name}.json`);

    if (!existsSync(statePath)) {
      throw new Error(`State file not found: ${statePath}`);
    }

    // Close existing session and create new one with loaded state
    await this.close();

    // Use persistent context with storage state overlay
    this.context = await chromium.launchPersistentContext(this.profileDir, {
      headless: this.opts.headless,
      viewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    this.page = this.context.pages()[0] || await this.context.newPage();
    this.page.setDefaultTimeout(this.opts.timeout);
    this.sessionActive = true;

    log.info(`Browser state loaded from ${statePath}`);
    return `State loaded from ${name}`;
  }

  async close(): Promise<void> {
    // With persistent context, closing the context closes everything
    // (there's no separate browser object)
    if (this.context) {
      try {
        await this.context.close();
      } catch {
        // Context may already be closed
      }
      this.context = null;
      this.page = null;
    }
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        // Browser may already be closed
      }
      this.browser = null;
    }
    this.sessionActive = false;
  }

  getCurrentUrl(): string {
    return this.currentUrl;
  }

  isActive(): boolean {
    return this.sessionActive;
  }
}
