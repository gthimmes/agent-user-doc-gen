import type { WorkflowStepConfig } from './config.js';

export interface WorkflowRecording {
  workflowId: string;
  name: string;
  description: string;
  recordedAt: string;
  steps: RecordedStep[];
  success: boolean;
  error?: string;
}

export interface RecordedStep {
  index: number;
  config: WorkflowStepConfig;
  screenshotPath?: string;
  snapshotText?: string;
  beforeUrl: string;
  afterUrl: string;
  timestamp: string;
  success: boolean;
  error?: string;
}
