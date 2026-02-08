import type { PageCapture } from '../types/capture.js';
import type { DocumentationPage, ScreenshotRef } from '../types/output.js';
import type { GenerationConfig, OutputConfig } from '../types/config.js';
import { analyzePageForReference } from './claude-analyzer.js';
import { renderTemplate, getTemplatePath } from './template-engine.js';
import { slugify, pathToSlug } from '../utils/slug.js';
import { log } from '../utils/logger.js';
import { basename } from 'node:path';

/**
 * Generate a reference documentation page from a page capture.
 */
export async function generateReferencePage(
  capture: PageCapture,
  genConfig: GenerationConfig,
  outputConfig: OutputConfig,
  order: number,
): Promise<DocumentationPage> {
  log.info(`Generating reference for: ${capture.title}`);

  // Use Claude to analyze the page and generate content
  const content = await analyzePageForReference(capture, genConfig);

  // Build screenshot references
  const screenshots: ScreenshotRef[] = [];
  if (genConfig.includeScreenshots && capture.screenshotPath) {
    const screenshotFilename = basename(capture.screenshotPath);
    screenshots.push({
      id: `ref-${pathToSlug(capture.path)}-main`,
      sourcePath: capture.screenshotPath,
      outputPath: `${outputConfig.screenshotDir}/${screenshotFilename}`,
      alt: `${capture.title} page screenshot`,
      caption: capture.title,
    });
  }

  // Add section screenshots
  for (const section of capture.sections) {
    if (section.screenshotPath) {
      const filename = basename(section.screenshotPath);
      screenshots.push({
        id: `ref-${pathToSlug(capture.path)}-${slugify(section.name)}`,
        sourcePath: section.screenshotPath,
        outputPath: `${outputConfig.screenshotDir}/${filename}`,
        alt: `${section.name} section`,
        caption: section.name,
      });
    }
  }

  const slug = pathToSlug(capture.path) || 'index';

  // Replace placeholder screenshot references with actual paths
  let finalContent = content;
  if (screenshots.length > 0) {
    finalContent = finalContent.replace(
      /!\[Screenshot\]\(screenshot-placeholder\.png\)/g,
      `![${capture.title}](${screenshots[0].outputPath})`,
    );
  }

  return {
    id: `ref-${slug}`,
    title: capture.title,
    slug: `reference/${slug}`,
    type: 'reference',
    content: finalContent,
    screenshots,
    sourceCapturePaths: [capture.path],
    order,
  };
}
