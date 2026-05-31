import { createHash, timingSafeEqual } from 'crypto';

export function hashPassword(password: string): string {
  return createHash('sha256').update(`health-care:${password}`).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  const a = Buffer.from(hashPassword(password));
  const b = Buffer.from(hash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
