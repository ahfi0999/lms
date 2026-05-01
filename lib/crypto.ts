import * as crypto from 'crypto';

export function getHash(content: string) {
  return crypto.createHash('md5').update(content).digest('hex');
}
