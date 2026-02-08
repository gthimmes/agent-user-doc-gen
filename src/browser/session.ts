import type { AuthConfig } from '../types/config.js';
import type { AgentBrowser } from './agent.js';
import { log } from '../utils/logger.js';
import { sleep } from '../utils/retry.js';

const AUTH_STATE_NAME = 'docgen-auth';

/**
 * Handle authentication lifecycle: login, save state, load state, verify.
 */
export class BrowserSession {
  constructor(
    private browser: AgentBrowser,
    private authConfig: AuthConfig,
  ) {}

  /**
   * Ensure the browser is authenticated.
   * Tries to load saved state first, falls back to login.
   */
  async ensureAuthenticated(baseUrl: string): Promise<void> {
    const strategy = this.authConfig.strategy;
    log.info(`Auth strategy: ${strategy}`);

    if (strategy === 'state-file') {
      const stateFile = this.authConfig.stateFile ?? AUTH_STATE_NAME;
      try {
        await this.browser.stateLoad(stateFile);
        log.info('Loaded saved auth state');
        await this.browser.navigate(baseUrl);
        if (await this.verifyAuth()) return;
        log.warn('Saved state expired, need to re-authenticate');
      } catch {
        log.info('No saved state found, need to authenticate');
      }
    }

    if (strategy === 'form') {
      await this.loginWithForm(baseUrl);
      return;
    }

    // manual strategy: open the login page and wait for user
    if (strategy === 'manual') {
      await this.manualLogin(baseUrl);
      return;
    }
  }

  private async loginWithForm(baseUrl: string): Promise<void> {
    const creds = this.authConfig.credentials;
    if (!creds) {
      throw new Error('Form auth strategy requires credentials config');
    }

    const loginUrl = this.authConfig.loginUrl ?? baseUrl;
    await this.browser.open(loginUrl);
    await sleep(2000);

    const username = process.env[creds.usernameEnv];
    const password = process.env[creds.passwordEnv];
    if (!username || !password) {
      throw new Error(
        `Missing credentials: set ${creds.usernameEnv} and ${creds.passwordEnv} environment variables`,
      );
    }

    // Take snapshot to find form elements
    const snapshot = await this.browser.snapshot(true);
    log.debug('Login page snapshot taken');

    if (creds.usernameSelector) {
      await this.browser.fill(creds.usernameSelector, username);
    }
    if (creds.passwordSelector) {
      await this.browser.fill(creds.passwordSelector, password);
    }
    if (creds.submitSelector) {
      await this.browser.click(creds.submitSelector);
    }

    await sleep(3000);

    if (await this.verifyAuth()) {
      log.success('Authentication successful');
      await this.browser.stateSave(AUTH_STATE_NAME);
      log.info('Auth state saved');
    } else {
      throw new Error('Authentication failed - verification check did not pass');
    }
  }

  private async manualLogin(baseUrl: string): Promise<void> {
    const loginUrl = this.authConfig.loginUrl ?? baseUrl;
    log.info(`Opening login page: ${loginUrl}`);
    log.info('Please complete authentication manually in the browser.');
    log.info('The process will continue once authentication is detected...');

    await this.browser.open(loginUrl);

    // Poll for auth success
    const maxWait = 120_000;
    const pollInterval = 3000;
    let waited = 0;

    while (waited < maxWait) {
      await sleep(pollInterval);
      waited += pollInterval;

      if (await this.verifyAuth()) {
        log.success('Authentication detected');
        await this.browser.stateSave(AUTH_STATE_NAME);
        log.info('Auth state saved');
        return;
      }
    }

    throw new Error('Authentication timed out after 2 minutes');
  }

  async verifyAuth(): Promise<boolean> {
    try {
      if (this.authConfig.verifyUrl) {
        await this.browser.navigate(this.authConfig.verifyUrl);
        await sleep(1000);
      }

      const snapshot = await this.browser.snapshot(true);
      const text = snapshot.raw.toLowerCase();

      // Check for verify selector text in snapshot
      if (this.authConfig.verifySelector) {
        return text.includes(this.authConfig.verifySelector.toLowerCase());
      }

      // Generic: if we don't see login/signin keywords, assume authenticated
      const loginKeywords = ['sign in', 'log in', 'login', 'signin', 'authenticate'];
      const hasLoginPrompt = loginKeywords.some((kw) => text.includes(kw));
      return !hasLoginPrompt;
    } catch {
      return false;
    }
  }

  async saveState(name?: string): Promise<void> {
    await this.browser.stateSave(name ?? AUTH_STATE_NAME);
  }

  async loadState(name?: string): Promise<void> {
    await this.browser.stateLoad(name ?? AUTH_STATE_NAME);
  }
}
