export interface DocumentationBundle {
  siteName: string;
  generatedAt: string;
  pages: DocumentationPage[];
  toc: TocEntry[];
}

export interface DocumentationPage {
  id: string;
  title: string;
  slug: string;
  type: 'tutorial' | 'reference' | 'index';
  content: string;
  screenshots: ScreenshotRef[];
  sourceCapturePaths: string[];
  order: number;
}

export interface ScreenshotRef {
  id: string;
  sourcePath: string;
  outputPath: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface TocEntry {
  title: string;
  slug: string;
  type: 'tutorial' | 'reference' | 'index';
  children: TocEntry[];
  order: number;
}
