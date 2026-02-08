import type { DocGenConfig } from '../../types/config.js';
import { AgentBrowser } from '../../browser/agent.js';
import { BrowserSession } from '../../browser/session.js';
import { log } from '../../utils/logger.js';

export async function runAuth(config: DocGenConfig): Promise<void> {
  log.info('Starting authentication flow...');

  const browser = new AgentBrowser();
  const session = new BrowserSession(browser, config.auth);

  try {
    await session.ensureAuthenticated(config.portal.baseUrl);
    log.success('Authentication complete and state saved');
  } catch (error) {
    log.error(`Authentication failed: ${error instanceof Error ? error.message : error}`);
    throw error;
  }
}
