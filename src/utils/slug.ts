export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function pathToSlug(urlPath: string): string {
  return slugify(
    urlPath
      .replace(/^\//, '')
      .replace(/\/$/, '')
      .replace(/\//g, '-'),
  );
}

export function screenshotFilename(prefix: string, index?: number, ext = 'png'): string {
  const suffix = index !== undefined ? `-${String(index).padStart(3, '0')}` : '';
  return `${slugify(prefix)}${suffix}.${ext}`;
}
