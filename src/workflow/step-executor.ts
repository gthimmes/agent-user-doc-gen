import type { WorkflowStepConfig } from '../types/config.js';
import type { AgentBrowser } from '../browser/agent.js';
import { sleep } from '../utils/retry.js';
import { log } from '../utils/logger.js';

/**
 * Execute a single workflow step.
 */
export async function executeStep(
  browser: AgentBrowser,
  step: WorkflowStepConfig,
): Promise<void> {
  log.step(`${step.action}: ${step.description}`);

  switch (step.action) {
    case 'click':
      await browser.click(step.target!);
      break;

    case 'fill':
      await browser.fill(step.target!, step.value!);
      break;

    case 'select':
      await browser.select(step.target!, step.value!);
      break;

    case 'hover':
      await browser.hover(step.target!);
      break;

    case 'scroll':
      await browser.scroll(
        (step.target as 'up' | 'down') ?? 'down',
        step.value ? parseInt(step.value, 10) : undefined,
      );
      break;

    case 'navigate':
      await browser.navigate(step.target!);
      break;

    case 'wait':
      await sleep(step.value ? parseInt(step.value, 10) : 1000);
      break;

    case 'screenshot':
      // Screenshot is handled by the recorder, this is a no-op marker
      break;

    case 'assert': {
      const snapshot = await browser.snapshot(true);
      if (!snapshot.raw.includes(step.target!)) {
        throw new Error(`Assertion failed: expected to find "${step.target}" in page`);
      }
      break;
    }

    default:
      throw new Error(`Unknown action: ${step.action}`);
  }

  if (step.waitAfter) {
    await sleep(step.waitAfter);
  }
}
