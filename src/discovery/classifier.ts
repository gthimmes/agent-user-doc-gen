import type { PageClassification, ElementInfo } from '../types/capture.js';

/**
 * Classify a page based on its URL path and snapshot content.
 */
export function classifyPage(
  path: string,
  elements: ElementInfo[],
  snapshotText: string,
): PageClassification {
  const lowerPath = path.toLowerCase();
  const lowerText = snapshotText.toLowerCase();

  // Path-based heuristics
  if (lowerPath.includes('dashboard') || lowerPath === '/' || lowerPath.endsWith('/portal')) {
    return 'dashboard';
  }
  if (lowerPath.includes('settings') || lowerPath.includes('preferences') || lowerPath.includes('config')) {
    return 'settings';
  }
  if (lowerPath.includes('report')) {
    return 'report';
  }

  // Content-based heuristics
  const tables = elements.filter((e) => e.tag === 'table' || e.role === 'grid');
  const forms = elements.filter((e) => e.tag === 'form');
  const inputs = elements.filter(
    (e) => e.tag === 'input' || e.tag === 'textarea' || e.tag === 'select',
  );
  const links = elements.filter((e) => e.tag === 'a');

  // Forms with many inputs -> form page
  if (forms.length > 0 || inputs.length > 5) {
    return 'form';
  }

  // Tables or many repeating list items -> list page
  if (tables.length > 0 || lowerText.includes('showing') || lowerText.includes('results')) {
    return 'list';
  }

  // Single item with details -> detail page
  if (
    lowerPath.match(/\/\d+$/) ||
    lowerPath.match(/\/[a-f0-9-]{36}$/) ||
    lowerPath.includes('/detail') ||
    lowerPath.includes('/view/')
  ) {
    return 'detail';
  }

  // Check for modal indicators
  if (lowerText.includes('dialog') || lowerText.includes('modal')) {
    return 'modal';
  }

  return 'unknown';
}
