import type { DocGenConfig } from '../../types/config.js';
import { AgentBrowser } from '../../browser/agent.js';
import { BrowserSession } from '../../browser/session.js';
import { recordAllWorkflows, recordWorkflow } from '../../workflow/recorder.js';
import { log } from '../../utils/logger.js';

export async function runRecord(
  config: DocGenConfig,
  options: { all?: boolean; workflow?: string },
): Promise<void> {
  if (config.workflows.length === 0) {
    log.warn('No workflows defined in config. Add workflows to config/default.yaml');
    return;
  }

  const browser = new AgentBrowser();
  const session = new BrowserSession(browser, config.auth);

  try {
    await session.ensureAuthenticated(config.portal.baseUrl);

    if (options.workflow) {
      // Record a specific workflow
      const wf = config.workflows.find((w) => w.id === options.workflow);
      if (!wf) {
        log.error(`Workflow not found: ${options.workflow}`);
        log.info(`Available workflows: ${config.workflows.map((w) => w.id).join(', ')}`);
        return;
      }
      await recordWorkflow(browser, wf, config.portal.baseUrl, config.capture.captureDir);
    } else {
      // Record all workflows
      const recordings = await recordAllWorkflows(
        browser,
        config.workflows,
        config.portal.baseUrl,
        config.capture.captureDir,
      );
      log.success(
        `Recorded ${recordings.filter((r) => r.success).length}/${recordings.length} workflows`,
      );
    }
  } finally {
    await browser.close();
  }
}
