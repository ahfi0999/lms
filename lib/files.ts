import formidable from 'formidable';
import fs from 'fs/promises';
import { NextApiRequest } from 'next';
import path from 'path';
import title from 'title';
import { FileInfo } from '../types/utils';
import markdownToHtml from './markdown-to-html';
import { getHash } from './crypto';

export function parseMultipartFormData(req: NextApiRequest) {
  return new Promise<{
    fields: formidable.Fields;
    files: formidable.Files;
  }>((resolve, reject) => {
    const form = formidable();
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      }

      resolve({ fields, files });
    });
  });
}

export async function getContentFolders() {
  const contentPath = path.join(process.cwd(), 'content');
  const folders = await fs.readdir(contentPath);

  return folders.map((folder) => ({
    label: `${title(folder.replace(/-/g, ' '))} (${folder}))`,
    value: folder,
  }));
}

export async function getContent(relativePath: string) {
  const contentPath = path.join(process.cwd(), 'content', relativePath);
  const markdown = await fs.readFile(contentPath, 'utf-8');
  const html = await markdownToHtml(markdown);
  return html;
}

export async function getContentTree(folder: string): Promise<FileInfo[]> {
  const contentPath = path.join(process.cwd(), 'content', folder);
  const files = await fs.readdir(contentPath);

  return Promise.all(
    files.map(async (file) => {
      const filePath = path.join(contentPath, file);
      const relativePath = path.join(folder, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        return {
          name: title(file),
          path: relativePath,
          nestedFiles: await getContentTree(path.join(folder, file)),
          type: 'folder',
        };
      } else {
        return {
          name: title(file.replace('.md', '').replace(/-/g, ' ')),
          path: relativePath,
          type: 'file',
        };
      }
    })
  );
}

export function convertArrayOfObjectsToCSV<T extends Record<string, any>>(data: T[]): string {
  const separator = ',';
  const keys = Object.keys(data[0]);

  const csvHeader = keys.join(separator);

  const csvRows = data.map((row) => {
    return keys
      .map((key) => {
        // Check if the value contains a comma, if so, wrap it in double quotes and escape any existing double quotes.
        const value = String(row[key]).includes(',')
          ? `"${row[key].replace(/"/g, '""')}"`
          : row[key];
        return value;
      })
      .join(separator);
  });

  return [csvHeader, ...csvRows].join('\n');
}
