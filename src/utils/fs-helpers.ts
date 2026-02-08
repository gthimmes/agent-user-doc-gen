import { mkdir, readFile, writeFile, access, readdir, copyFile } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await ensureDir(dirname(filePath));
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function readJson<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

export async function writeText(filePath: string, content: string): Promise<void> {
  await ensureDir(dirname(filePath));
  await writeFile(filePath, content, 'utf-8');
}

export async function readText(filePath: string): Promise<string> {
  return readFile(filePath, 'utf-8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function listFiles(dirPath: string, extension?: string): Promise<string[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    let files = entries
      .filter((e) => e.isFile())
      .map((e) => join(dirPath, e.name));
    if (extension) {
      files = files.filter((f) => extname(f) === extension);
    }
    return files;
  } catch {
    return [];
  }
}

export async function copyFileToDir(src: string, destDir: string, newName?: string): Promise<string> {
  await ensureDir(destDir);
  const dest = join(destDir, newName ?? src.split(/[/\\]/).pop()!);
  await copyFile(src, dest);
  return dest;
}
