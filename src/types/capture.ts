export interface PageCapture {
  url: string;
  path: string;
  title: string;
  timestamp: string;
  screenshotPath: string;
  snapshotText: string;
  elements: ElementInfo[];
  links: LinkInfo[];
  sections: SectionCapture[];
  classification: PageClassification;
  metadata: Record<string, string>;
}

export interface SectionCapture {
  name: string;
  selector: string;
  screenshotPath?: string;
  text: string;
  elements: ElementInfo[];
}

export interface ElementInfo {
  ref: string;
  tag: string;
  role?: string;
  text: string;
  attributes: Record<string, string>;
  interactable: boolean;
}

export interface LinkInfo {
  text: string;
  href: string;
  isInternal: boolean;
  ref?: string;
}

export type PageClassification =
  | 'dashboard'
  | 'list'
  | 'detail'
  | 'form'
  | 'settings'
  | 'report'
  | 'modal'
  | 'unknown';

export interface Sitemap {
  baseUrl: string;
  capturedAt: string;
  pages: SitemapEntry[];
}

export interface SitemapEntry {
  url: string;
  path: string;
  title: string;
  classification: PageClassification;
  depth: number;
  parent?: string;
  links: string[];
}
