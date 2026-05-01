import { Module } from '../types/courses';
import logger from './logger';

export const getOrderedModules = (modules: Module[], modulesOrder: number[]) =>
  modulesOrder
    .map((moduleId) => modules.find((module) => module.id === moduleId))
    .filter((module) => module !== undefined) as Module[];

export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  }

  return result;
}

export async function runWithoutErrors<T>(fn: () => T): Promise<[Error, null] | [null, T]> {
  try {
    const result = await fn();
    return [null, result];
  } catch (error) {
    logger.error("Error thrown in 'runWithoutErrors'", error);
    if (error instanceof Error) {
      return [error, null];
    }

    return [new Error('Unknown error'), null];
  }
}

export function toBase64(data: string) {
  const buffer = Buffer.from(data);
  return buffer.toString('base64');
}

export function isAzureBlobUrl(url: string) {
  return url.startsWith('https://') && url.includes('.blob.core.windows.net/');
}

export async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      return retry(fn, retries - 1);
    }
    throw error;
  }
}

export function listFormatter(list: string[]) {
  const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
  return formatter.format(list);
}
