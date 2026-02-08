import type { ElementInfo, LinkInfo } from '../types/capture.js';

/**
 * Parse agent-browser snapshot output into structured element data.
 *
 * Snapshot lines typically look like:
 *   [ref] tag role "text" attr=value
 * or for interactive snapshots:
 *   [ref] <tag> "visible text"
 */
export function parseSnapshot(raw: string): ElementInfo[] {
  const elements: ElementInfo[] = [];
  const lines = raw.split('\n').filter((l) => l.trim());

  for (const line of lines) {
    const element = parseLine(line);
    if (element) {
      elements.push(element);
    }
  }

  return elements;
}

function parseLine(line: string): ElementInfo | null {
  // Match patterns like: [ref123] or [42] at start
  const refMatch = line.match(/^\[([^\]]+)\]\s*(.*)/);
  if (!refMatch) {
    // Non-ref lines are text content
    return null;
  }

  const ref = refMatch[1];
  const rest = refMatch[2];

  // Try to parse tag
  const tagMatch = rest.match(/^<(\w+)>\s*(.*)/);
  const tag = tagMatch ? tagMatch[1] : 'unknown';
  const remaining = tagMatch ? tagMatch[2] : rest;

  // Extract quoted text
  const textMatch = remaining.match(/"([^"]*)"/);
  const text = textMatch ? textMatch[1] : remaining.trim();

  // Extract role if present
  const roleMatch = remaining.match(/role="([^"]+)"/);
  const role = roleMatch ? roleMatch[1] : undefined;

  // Determine if interactable based on tag/role
  const interactableTags = new Set([
    'a', 'button', 'input', 'select', 'textarea', 'details', 'summary',
  ]);
  const interactableRoles = new Set([
    'button', 'link', 'textbox', 'checkbox', 'radio', 'tab', 'menuitem',
    'combobox', 'option', 'switch',
  ]);
  const interactable = interactableTags.has(tag) || (role ? interactableRoles.has(role) : false);

  // Extract attributes
  const attributes: Record<string, string> = {};
  const attrMatches = remaining.matchAll(/(\w+)="([^"]*)"/g);
  for (const m of attrMatches) {
    if (m[1] !== 'role') {
      attributes[m[1]] = m[2];
    }
  }

  return { ref, tag, role, text, attributes, interactable };
}

/**
 * Extract links from parsed elements.
 */
export function extractLinks(elements: ElementInfo[], baseUrl: string): LinkInfo[] {
  const links: LinkInfo[] = [];
  const seen = new Set<string>();
  const base = new URL(baseUrl);

  for (const el of elements) {
    if (el.tag !== 'a' && !el.attributes['href']) continue;
    const href = el.attributes['href'];
    if (!href || seen.has(href)) continue;
    seen.add(href);

    let isInternal = false;
    try {
      const url = new URL(href, baseUrl);
      isInternal = url.hostname === base.hostname;
    } catch {
      isInternal = href.startsWith('/');
    }

    links.push({
      text: el.text,
      href,
      isInternal,
      ref: el.ref,
    });
  }

  return links;
}

/**
 * Extract page title from snapshot text.
 */
export function extractTitle(snapshotText: string): string {
  // Look for heading-like elements or title
  const lines = snapshotText.split('\n');
  for (const line of lines) {
    const h1Match = line.match(/<h1[^>]*>\s*"([^"]+)"/);
    if (h1Match) return h1Match[1];

    const titleMatch = line.match(/<title[^>]*>\s*"([^"]+)"/);
    if (titleMatch) return titleMatch[1];
  }

  // Fallback: first non-empty meaningful text
  for (const line of lines) {
    const textMatch = line.match(/"([^"]{3,})"/);
    if (textMatch) return textMatch[1].slice(0, 80);
  }

  return 'Untitled Page';
}
