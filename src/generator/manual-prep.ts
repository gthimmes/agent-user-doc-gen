import { join } from 'node:path';
import type { PageCapture } from '../types/capture.js';
import type { WorkflowRecording } from '../types/workflow.js';
import type { OutputConfig } from '../types/config.js';
import { ensureDir, writeText, listFiles, readJson } from '../utils/fs-helpers.js';
import { log } from '../utils/logger.js';

/**
 * Prepare captures for Claude Code to process manually.
 * Creates a structured summary and instructions file.
 */
export async function prepareForManualGeneration(
  captures: PageCapture[],
  recordings: WorkflowRecording[],
  outputConfig: OutputConfig,
  captureDir: string,
): Promise<string> {
  const prepDir = join(captureDir, 'for-claude-code');
  await ensureDir(prepDir);

  // 1. Write the master instruction file
  const instructions = buildInstructions(captures, recordings, outputConfig);
  const instructionsPath = join(prepDir, 'GENERATE.md');
  await writeText(instructionsPath, instructions);

  // 2. Write individual page summaries (easy for Claude Code to read)
  for (const capture of captures) {
    const slug = capture.path.replace(/\//g, '_').replace(/^_/, '') || 'index';
    const summary = buildPageSummary(capture);
    await writeText(join(prepDir, `page-${slug}.md`), summary);
  }

  // 3. Write workflow summaries
  for (const recording of recordings) {
    const summary = buildWorkflowSummary(recording);
    await writeText(join(prepDir, `workflow-${recording.workflowId}.md`), summary);
  }

  // 4. Write a screenshot manifest (paths to all screenshots)
  const screenshotManifest = buildScreenshotManifest(captures, recordings);
  await writeText(join(prepDir, 'screenshots.md'), screenshotManifest);

  log.success(`Prepared ${captures.length} page summaries and ${recordings.length} workflow summaries`);
  log.success(`Instructions written to: ${instructionsPath}`);
  log.info('');
  log.info('Next step: Tell Claude Code to read the instructions file:');
  log.info(`  "Read ${instructionsPath} and follow the instructions to generate documentation"`);

  return instructionsPath;
}

function buildInstructions(
  captures: PageCapture[],
  recordings: WorkflowRecording[],
  outputConfig: OutputConfig,
): string {
  const pageList = captures
    .map((c, i) => `${i + 1}. **${c.title}** (${c.classification}) - \`page-${c.path.replace(/\//g, '_').replace(/^_/, '') || 'index'}.md\` - Screenshot: \`${c.screenshotPath}\``)
    .join('\n');

  const workflowList = recordings.length > 0
    ? recordings
        .map((r, i) => `${i + 1}. **${r.name}** - \`workflow-${r.workflowId}.md\` (${r.steps.length} steps, ${r.success ? 'success' : 'FAILED'})`)
        .join('\n')
    : '_No workflows recorded._';

  return `# Documentation Generation Instructions

## What To Do
You are generating user documentation from captured page data and screenshots.
Read the page summary files and screenshots in this directory, then generate
Markdown documentation files in \`${outputConfig.dir}/\`.

## Captured Pages
${pageList}

## Recorded Workflows
${workflowList}

## How To Generate

### For each page, generate a Reference doc:
1. Read the page summary file (e.g. \`page-portal.md\`)
2. View the screenshot at the path listed in the summary
3. Write a reference documentation page that:
   - Describes what the page is for
   - Explains each section and its purpose
   - Documents buttons, links, and form fields by their actual names
   - Embeds the screenshot with \`![Page Title](screenshots/filename.png)\`
4. Save as \`${outputConfig.dir}/markdown/reference/<slug>.md\`

### For each workflow, generate a Tutorial:
1. Read the workflow summary file
2. View the step screenshots
3. Write a step-by-step tutorial that:
   - Introduces what the user will accomplish
   - Provides numbered steps with embedded screenshots
   - Explains what the user should see at each step
4. Save as \`${outputConfig.dir}/markdown/tutorials/<slug>.md\`

### Generate an Index page:
1. Create \`${outputConfig.dir}/markdown/index.md\` with:
   - Overview of the application
   - Links to all reference and tutorial pages
   - Table of contents

## Output Structure
\`\`\`
${outputConfig.dir}/
  markdown/
    index.md
    reference/
      <page-slug>.md
    tutorials/
      <workflow-slug>.md
  screenshots/
    (copy screenshots from .captures/screenshots/ to here)
\`\`\`

## Screenshot Handling
Screenshots are in \`.captures/screenshots/\`. When writing docs, reference them
relative to the output dir: \`screenshots/<filename>.png\`
Copy the screenshot files to \`${outputConfig.dir}/screenshots/\` when done.

## Style Guide
- Write for end-users who may not be technical
- Use clear, concise language
- Reference UI elements by their actual names (button text, menu labels)
- Include tips or warnings where relevant
- Use Markdown formatting: headings, bullet lists, bold for UI elements, code blocks for paths/values
`;
}

function buildPageSummary(capture: PageCapture): string {
  const buttons = capture.elements
    .filter((e) => e.tag === 'button' || e.role === 'button')
    .map((e) => e.text)
    .filter(Boolean);

  const headings = capture.elements
    .filter((e) => e.tag.match(/^h[1-6]$/))
    .map((e) => `${e.tag}: ${e.text}`)
    .filter((t) => t.length > 4);

  const links = capture.links
    .filter((l) => l.isInternal)
    .map((l) => `[${l.text}](${l.href})`)
    .slice(0, 20);

  const inputs = capture.elements
    .filter((e) => e.tag === 'input' || e.tag === 'textarea' || e.tag === 'select')
    .map((e) => `${e.tag}${e.attributes['placeholder'] ? ` (${e.attributes['placeholder']})` : ''}${e.attributes['type'] ? ` [type=${e.attributes['type']}]` : ''}`)
    .slice(0, 15);

  const sections = capture.sections
    .map((s) => `### ${s.name}\n${s.text.slice(0, 500)}${s.text.length > 500 ? '\n...(truncated)' : ''}`)
    .join('\n\n');

  return `# Page: ${capture.title}

- **URL**: ${capture.url}
- **Path**: ${capture.path}
- **Type**: ${capture.classification}
- **Captured**: ${capture.timestamp}
- **Screenshot**: \`${capture.screenshotPath}\`

## Page Content (snapshot)
\`\`\`
${capture.snapshotText.slice(0, 8000)}${capture.snapshotText.length > 8000 ? '\n... (truncated)' : ''}
\`\`\`

## Headings
${headings.length > 0 ? headings.map((h) => `- ${h}`).join('\n') : '_None found_'}

## Buttons
${buttons.length > 0 ? buttons.map((b) => `- "${b}"`).join('\n') : '_None found_'}

## Form Fields
${inputs.length > 0 ? inputs.map((i) => `- ${i}`).join('\n') : '_None found_'}

## Internal Links
${links.length > 0 ? links.join('\n') : '_None found_'}

## Sections
${sections || '_No sections captured_'}
`;
}

function buildWorkflowSummary(recording: WorkflowRecording): string {
  const steps = recording.steps
    .map((s) => {
      const status = s.success ? 'OK' : `FAILED: ${s.error}`;
      return `### Step ${s.index + 1}: ${s.config.description}
- **Action**: ${s.config.action}${s.config.target ? ` on "${s.config.target}"` : ''}${s.config.value ? ` with "${s.config.value}"` : ''}
- **Screenshot**: \`${s.screenshotPath}\`
- **URL before**: ${s.beforeUrl}
- **URL after**: ${s.afterUrl}
- **Status**: ${status}`;
    })
    .join('\n\n');

  return `# Workflow: ${recording.name}

- **ID**: ${recording.workflowId}
- **Description**: ${recording.description}
- **Recorded**: ${recording.recordedAt}
- **Success**: ${recording.success}
${recording.error ? `- **Error**: ${recording.error}` : ''}

## Steps
${steps}
`;
}

function buildScreenshotManifest(
  captures: PageCapture[],
  recordings: WorkflowRecording[],
): string {
  const lines = ['# Screenshot Manifest', '', '## Page Screenshots'];

  for (const c of captures) {
    lines.push(`- **${c.title}**: \`${c.screenshotPath}\``);
    for (const s of c.sections) {
      if (s.screenshotPath) {
        lines.push(`  - ${s.name}: \`${s.screenshotPath}\``);
      }
    }
  }

  lines.push('', '## Workflow Step Screenshots');
  for (const r of recordings) {
    lines.push(`### ${r.name}`);
    for (const s of r.steps) {
      if (s.screenshotPath) {
        lines.push(`- Step ${s.index + 1} (${s.config.description}): \`${s.screenshotPath}\``);
      }
    }
  }

  return lines.join('\n');
}
