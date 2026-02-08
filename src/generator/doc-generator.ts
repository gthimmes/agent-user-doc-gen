import type { PageCapture } from '../types/capture.js';
import type { WorkflowRecording } from '../types/workflow.js';
import type { DocumentationBundle, DocumentationPage, TocEntry } from '../types/output.js';
import type { GenerationConfig, OutputConfig } from '../types/config.js';
import { generateReferencePage } from './reference-writer.js';
import { generateTutorialPage } from './tutorial-writer.js';
import { generateOverview } from './claude-analyzer.js';
import { registerHelpers } from './template-engine.js';
import { slugify } from '../utils/slug.js';
import { log } from '../utils/logger.js';

/**
 * Main orchestrator: convert captures + recordings into a DocumentationBundle.
 */
export async function generateDocumentation(
  captures: PageCapture[],
  recordings: WorkflowRecording[],
  genConfig: GenerationConfig,
  outputConfig: OutputConfig,
): Promise<DocumentationBundle> {
  registerHelpers();

  const pages: DocumentationPage[] = [];
  let order = 0;

  // Generate reference pages
  if (genConfig.docTypes.includes('reference')) {
    log.info(`Generating reference pages for ${captures.length} captures...`);
    for (const capture of captures) {
      try {
        const page = await generateReferencePage(capture, genConfig, outputConfig, order++);
        pages.push(page);
      } catch (error) {
        log.error(`Failed to generate reference for ${capture.title}: ${error}`);
      }
    }
  }

  // Generate tutorials from workflow recordings
  if (genConfig.docTypes.includes('tutorial')) {
    log.info(`Generating tutorials for ${recordings.length} workflows...`);
    for (const recording of recordings) {
      if (!recording.success) {
        log.warn(`Skipping failed workflow: ${recording.name}`);
        continue;
      }
      try {
        const page = await generateTutorialPage(recording, genConfig, outputConfig, order++);
        pages.push(page);
      } catch (error) {
        log.error(`Failed to generate tutorial for ${recording.name}: ${error}`);
      }
    }
  }

  // Generate index page
  if (outputConfig.generateIndex) {
    log.info('Generating index page...');
    try {
      const overviewContent = await generateOverview(captures, outputConfig.siteName, genConfig);
      pages.unshift({
        id: 'index',
        title: outputConfig.siteName,
        slug: 'index',
        type: 'index',
        content: overviewContent,
        screenshots: [],
        sourceCapturePaths: captures.map((c) => c.path),
        order: -1,
      });
    } catch (error) {
      log.error(`Failed to generate index: ${error}`);
    }
  }

  // Build TOC
  const toc = buildToc(pages);

  return {
    siteName: outputConfig.siteName,
    generatedAt: new Date().toISOString(),
    pages,
    toc,
  };
}

function buildToc(pages: DocumentationPage[]): TocEntry[] {
  const toc: TocEntry[] = [];

  // Group by type
  const index = pages.filter((p) => p.type === 'index');
  const tutorials = pages.filter((p) => p.type === 'tutorial');
  const references = pages.filter((p) => p.type === 'reference');

  // Index at top
  for (const page of index) {
    toc.push({
      title: page.title,
      slug: page.slug,
      type: page.type,
      children: [],
      order: page.order,
    });
  }

  // Tutorials section
  if (tutorials.length > 0) {
    toc.push({
      title: 'Tutorials',
      slug: 'tutorials',
      type: 'tutorial',
      children: tutorials.map((p) => ({
        title: p.title,
        slug: p.slug,
        type: p.type,
        children: [],
        order: p.order,
      })),
      order: 0,
    });
  }

  // Reference section
  if (references.length > 0) {
    toc.push({
      title: 'Reference',
      slug: 'reference',
      type: 'reference',
      children: references.map((p) => ({
        title: p.title,
        slug: p.slug,
        type: p.type,
        children: [],
        order: p.order,
      })),
      order: 1,
    });
  }

  return toc;
}
