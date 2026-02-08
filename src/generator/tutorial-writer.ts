import type { WorkflowRecording } from '../types/workflow.js';
import type { DocumentationPage, ScreenshotRef } from '../types/output.js';
import type { GenerationConfig, OutputConfig } from '../types/config.js';
import { analyzeWorkflowForTutorial } from './claude-analyzer.js';
import { slugify } from '../utils/slug.js';
import { log } from '../utils/logger.js';
import { basename } from 'node:path';

/**
 * Generate a tutorial documentation page from a workflow recording.
 */
export async function generateTutorialPage(
  recording: WorkflowRecording,
  genConfig: GenerationConfig,
  outputConfig: OutputConfig,
  order: number,
): Promise<DocumentationPage> {
  log.info(`Generating tutorial for: ${recording.name}`);

  // Use Claude to generate tutorial content
  const content = await analyzeWorkflowForTutorial(recording, genConfig);

  // Build screenshot references from recorded steps
  const screenshots: ScreenshotRef[] = [];
  for (const step of recording.steps) {
    if (step.screenshotPath) {
      const filename = basename(step.screenshotPath);
      screenshots.push({
        id: `tut-${recording.workflowId}-step-${step.index}`,
        sourcePath: step.screenshotPath,
        outputPath: `${outputConfig.screenshotDir}/${filename}`,
        alt: step.config.description,
        caption: `Step ${step.index + 1}: ${step.config.description}`,
      });
    }
  }

  const slug = slugify(recording.workflowId);

  // Replace step screenshot placeholders with actual paths
  let finalContent = content;
  for (let i = 0; i < screenshots.length; i++) {
    const pattern = new RegExp(`!\\[Step ${i + 1}\\]\\(step-${i}\\.png\\)`, 'g');
    finalContent = finalContent.replace(
      pattern,
      `![Step ${i + 1}: ${screenshots[i].alt}](${screenshots[i].outputPath})`,
    );
  }

  return {
    id: `tut-${slug}`,
    title: recording.name,
    slug: `tutorials/${slug}`,
    type: 'tutorial',
    content: finalContent,
    screenshots,
    sourceCapturePaths: [],
    order,
  };
}
