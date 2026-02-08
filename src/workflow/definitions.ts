import type { WorkflowStepConfig } from '../types/config.js';

export const VALID_ACTIONS = [
  'click',
  'fill',
  'select',
  'wait',
  'screenshot',
  'assert',
  'navigate',
  'hover',
  'scroll',
] as const;

export type ActionType = (typeof VALID_ACTIONS)[number];

/**
 * Validate a workflow step configuration.
 */
export function validateStep(step: WorkflowStepConfig): string[] {
  const errors: string[] = [];

  if (!VALID_ACTIONS.includes(step.action as ActionType)) {
    errors.push(`Invalid action: ${step.action}`);
  }

  // Actions that require a target
  const needsTarget = new Set(['click', 'fill', 'select', 'hover', 'assert']);
  if (needsTarget.has(step.action) && !step.target) {
    errors.push(`Action '${step.action}' requires a target`);
  }

  // Actions that require a value
  const needsValue = new Set(['fill', 'select']);
  if (needsValue.has(step.action) && !step.value) {
    errors.push(`Action '${step.action}' requires a value`);
  }

  if (!step.description) {
    errors.push('Step description is required');
  }

  return errors;
}

/**
 * Validate all steps in a workflow.
 */
export function validateWorkflowSteps(steps: WorkflowStepConfig[]): string[] {
  const errors: string[] = [];
  for (let i = 0; i < steps.length; i++) {
    const stepErrors = validateStep(steps[i]);
    for (const err of stepErrors) {
      errors.push(`Step ${i + 1}: ${err}`);
    }
  }
  return errors;
}
