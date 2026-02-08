import type { ElementInfo } from '../types/capture.js';

export interface ElementInventory {
  total: number;
  interactable: number;
  byTag: Record<string, number>;
  byRole: Record<string, number>;
  navigation: ElementInfo[];
  forms: ElementInfo[];
  buttons: ElementInfo[];
  links: ElementInfo[];
  headings: ElementInfo[];
  tables: ElementInfo[];
}

/**
 * Build a structured inventory of elements on a page.
 */
export function buildElementInventory(elements: ElementInfo[]): ElementInventory {
  const byTag: Record<string, number> = {};
  const byRole: Record<string, number> = {};
  const navigation: ElementInfo[] = [];
  const forms: ElementInfo[] = [];
  const buttons: ElementInfo[] = [];
  const links: ElementInfo[] = [];
  const headings: ElementInfo[] = [];
  const tables: ElementInfo[] = [];

  for (const el of elements) {
    byTag[el.tag] = (byTag[el.tag] || 0) + 1;
    if (el.role) {
      byRole[el.role] = (byRole[el.role] || 0) + 1;
    }

    if (el.tag === 'nav' || el.role === 'navigation') {
      navigation.push(el);
    }
    if (el.tag === 'form') {
      forms.push(el);
    }
    if (el.tag === 'button' || el.role === 'button') {
      buttons.push(el);
    }
    if (el.tag === 'a' || el.role === 'link') {
      links.push(el);
    }
    if (el.tag.match(/^h[1-6]$/) || el.role === 'heading') {
      headings.push(el);
    }
    if (el.tag === 'table' || el.role === 'grid' || el.role === 'table') {
      tables.push(el);
    }
  }

  return {
    total: elements.length,
    interactable: elements.filter((e) => e.interactable).length,
    byTag,
    byRole,
    navigation,
    forms,
    buttons,
    links,
    headings,
    tables,
  };
}
