import Anthropic from '@anthropic-ai/sdk';
import type { PageCapture } from '../types/capture.js';
import type { WorkflowRecording } from '../types/workflow.js';
import type { GenerationConfig } from '../types/config.js';
import { log } from '../utils/logger.js';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

/**
 * Analyze a page capture and generate reference documentation.
 */
export async function analyzePageForReference(
  capture: PageCapture,
  config: GenerationConfig,
): Promise<string> {
  log.debug(`Analyzing page for reference: ${capture.title}`);

  const prompt = buildReferencePrompt(capture);

  const response = await getClient().messages.create({
    model: config.model,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return text;
}

/**
 * Analyze a workflow recording and generate a tutorial.
 */
export async function analyzeWorkflowForTutorial(
  recording: WorkflowRecording,
  config: GenerationConfig,
): Promise<string> {
  log.debug(`Analyzing workflow for tutorial: ${recording.name}`);

  const prompt = buildTutorialPrompt(recording);

  const response = await getClient().messages.create({
    model: config.model,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return text;
}

/**
 * Generate an overview/index page from all captures.
 */
export async function generateOverview(
  captures: PageCapture[],
  siteName: string,
  config: GenerationConfig,
): Promise<string> {
  const pageList = captures
    .map((c) => `- **${c.title}** (${c.classification}): ${c.path}`)
    .join('\n');

  const prompt = `You are a technical writer. Generate an overview/index page for "${siteName}" documentation.

Available pages:
${pageList}

Write a concise overview that:
1. Introduces the application
2. Summarizes what each section covers
3. Helps users find what they need

Output in Markdown format. Do not include a top-level heading (it will be added by the template).`;

  const response = await getClient().messages.create({
    model: config.model,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

function buildReferencePrompt(capture: PageCapture): string {
  const elemSummary = summarizeElements(capture);

  return `You are a technical writer creating user documentation for a web application.

Analyze this page and write a reference documentation page.

## Page Information
- **Title**: ${capture.title}
- **URL Path**: ${capture.path}
- **Page Type**: ${capture.classification}

## Page Content (snapshot)
${truncate(capture.snapshotText, 6000)}

## UI Elements
${elemSummary}

## Sections
${capture.sections.map((s) => `### ${s.name}\n${truncate(s.text, 500)}`).join('\n\n')}

## Instructions
Write reference documentation that:
1. Describes what this page is for
2. Explains each major section and its purpose
3. Documents available actions (buttons, links, forms)
4. Includes notes about any important elements
5. Uses placeholder image references like ![Screenshot](screenshot-placeholder.png)

Output in Markdown format. Do not include a top-level heading (it will be added by the template).
Be specific about the UI elements - reference actual button names, menu items, etc.`;
}

function buildTutorialPrompt(recording: WorkflowRecording): string {
  const steps = recording.steps
    .filter((s) => s.success)
    .map(
      (s) =>
        `Step ${s.index + 1}: ${s.config.description}\n  Action: ${s.config.action}${s.config.target ? ` on "${s.config.target}"` : ''}${s.config.value ? ` with value "${s.config.value}"` : ''}\n  Screenshot: step-${s.index}.png`,
    )
    .join('\n\n');

  return `You are a technical writer creating a step-by-step tutorial for a web application.

## Workflow
- **Name**: ${recording.name}
- **Description**: ${recording.description}

## Recorded Steps
${steps}

## Instructions
Write a step-by-step tutorial that:
1. Has a brief introduction explaining what the user will accomplish
2. Provides clear, numbered steps with screenshots referenced as ![Step N](step-N.png)
3. Explains what the user should see at each step
4. Includes tips or warnings where appropriate
5. Ends with a summary of what was accomplished

Output in Markdown format. Do not include a top-level heading (it will be added by the template).
Write for end-users who may not be technical.`;
}

function summarizeElements(capture: PageCapture): string {
  const buttons = capture.elements.filter(
    (e) => e.tag === 'button' || e.role === 'button',
  );
  const links = capture.elements.filter((e) => e.tag === 'a');
  const inputs = capture.elements.filter(
    (e) => e.tag === 'input' || e.tag === 'textarea' || e.tag === 'select',
  );
  const headings = capture.elements.filter((e) => e.tag.match(/^h[1-6]$/));

  const parts: string[] = [];

  if (headings.length > 0) {
    parts.push(
      `**Headings**: ${headings.map((h) => `${h.tag}: "${h.text}"`).join(', ')}`,
    );
  }
  if (buttons.length > 0) {
    parts.push(
      `**Buttons**: ${buttons.map((b) => `"${b.text}"`).filter(Boolean).join(', ')}`,
    );
  }
  if (links.length > 0) {
    parts.push(`**Links**: ${links.length} total`);
  }
  if (inputs.length > 0) {
    parts.push(`**Form fields**: ${inputs.length} inputs`);
  }

  return parts.join('\n') || 'No notable elements detected.';
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '\n... (truncated)';
}
