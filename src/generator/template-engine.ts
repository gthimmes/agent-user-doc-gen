import Handlebars from 'handlebars';
import { readText, fileExists } from '../utils/fs-helpers.js';
import { join } from 'node:path';
import { log } from '../utils/logger.js';

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

/**
 * Load and compile a Handlebars template from the templates directory.
 */
export async function loadTemplate(templatePath: string): Promise<HandlebarsTemplateDelegate> {
  if (templateCache.has(templatePath)) {
    return templateCache.get(templatePath)!;
  }

  if (!(await fileExists(templatePath))) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const source = await readText(templatePath);
  const compiled = Handlebars.compile(source);
  templateCache.set(templatePath, compiled);
  return compiled;
}

/**
 * Render a template with the given data.
 */
export async function renderTemplate(
  templatePath: string,
  data: Record<string, unknown>,
): Promise<string> {
  const template = await loadTemplate(templatePath);
  return template(data);
}

/**
 * Get the path to a template file.
 */
export function getTemplatePath(format: 'markdown' | 'html', name: string): string {
  const ext = format === 'markdown' ? 'md' : 'html';
  return join('templates', format, `${name}.${ext}.hbs`);
}

/**
 * Register common Handlebars helpers.
 */
export function registerHelpers(): void {
  Handlebars.registerHelper('ifEquals', function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
    return a === b ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper('toLowerCase', (str: string) => {
    return str?.toLowerCase() ?? '';
  });

  Handlebars.registerHelper('increment', (value: number) => {
    return value + 1;
  });

  Handlebars.registerHelper('screenshotPath', (dir: string, filename: string) => {
    return `${dir}/${filename}`;
  });

  Handlebars.registerHelper('date', (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });
}
