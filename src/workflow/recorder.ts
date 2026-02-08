import type { WorkflowConfig } from '../types/config.js';
import type { WorkflowRecording, RecordedStep } from '../types/workflow.js';
import type { AgentBrowser } from '../browser/agent.js';
import { executeStep } from './step-executor.js';
import { validateWorkflowSteps } from './definitions.js';
import { ScreenshotManager } from '../capture/screenshot-manager.js';
import { navigateAndWait } from '../browser/actions.js';
import { writeJson } from '../utils/fs-helpers.js';
import { log } from '../utils/logger.js';
import { join } from 'node:path';

/**
 * Record a workflow by executing its steps and capturing screenshots.
 */
export async function recordWorkflow(
  browser: AgentBrowser,
  workflow: WorkflowConfig,
  baseUrl: string,
  captureDir: string,
): Promise<WorkflowRecording> {
  log.info(`Recording workflow: ${workflow.name}`);

  // Validate steps
  const errors = validateWorkflowSteps(workflow.steps);
  if (errors.length > 0) {
    throw new Error(`Workflow validation failed:\n${errors.join('\n')}`);
  }

  const screenshotMgr = new ScreenshotManager(captureDir);
  await screenshotMgr.init();

  const recording: WorkflowRecording = {
    workflowId: workflow.id,
    name: workflow.name,
    description: workflow.description,
    recordedAt: new Date().toISOString(),
    steps: [],
    success: false,
  };

  try {
    // Navigate to start path
    const startUrl = new URL(workflow.startPath, baseUrl).toString();
    await navigateAndWait(browser, startUrl, 2000);

    for (let i = 0; i < workflow.steps.length; i++) {
      const stepConfig = workflow.steps[i];
      const beforeUrl = browser.getCurrentUrl();
      const timestamp = new Date().toISOString();
      const screenshotPath = screenshotMgr.workflowStepPath(workflow.id, i);

      try {
        // Execute the step
        await executeStep(browser, stepConfig);

        // Always take a screenshot after each step
        await browser.screenshot(screenshotPath);

        // Take snapshot for context
        const snapshot = await browser.snapshot(true);

        const recorded: RecordedStep = {
          index: i,
          config: stepConfig,
          screenshotPath,
          snapshotText: snapshot.raw,
          beforeUrl,
          afterUrl: browser.getCurrentUrl(),
          timestamp,
          success: true,
        };
        recording.steps.push(recorded);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        log.error(`Step ${i + 1} failed: ${errorMsg}`);

        // Try to take a screenshot even on failure
        try {
          await browser.screenshot(screenshotPath);
        } catch { /* ignore */ }

        recording.steps.push({
          index: i,
          config: stepConfig,
          screenshotPath,
          beforeUrl,
          afterUrl: browser.getCurrentUrl(),
          timestamp,
          success: false,
          error: errorMsg,
        });

        recording.error = `Step ${i + 1} failed: ${errorMsg}`;
        break;
      }
    }

    recording.success = recording.steps.every((s) => s.success);
  } catch (error) {
    recording.error = error instanceof Error ? error.message : String(error);
  }

  // Save recording
  const recordingPath = join(captureDir, 'workflows', `${workflow.id}.json`);
  await writeJson(recordingPath, recording);
  log.info(`Recording saved to ${recordingPath}`);

  if (recording.success) {
    log.success(`Workflow "${workflow.name}" recorded successfully (${recording.steps.length} steps)`);
  } else {
    log.warn(`Workflow "${workflow.name}" completed with errors`);
  }

  return recording;
}

/**
 * Record all configured workflows.
 */
export async function recordAllWorkflows(
  browser: AgentBrowser,
  workflows: WorkflowConfig[],
  baseUrl: string,
  captureDir: string,
): Promise<WorkflowRecording[]> {
  const recordings: WorkflowRecording[] = [];

  for (const workflow of workflows) {
    try {
      const recording = await recordWorkflow(browser, workflow, baseUrl, captureDir);
      recordings.push(recording);
    } catch (error) {
      log.error(`Failed to record workflow "${workflow.name}": ${error}`);
    }
  }

  return recordings;
}
