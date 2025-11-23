import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

function verifyPassword(storedHash, password) {
  if (!storedHash || !password) return false;
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derivedKey = scryptSync(password, salt, 64);
  const storedKey = Buffer.from(key, 'hex');
  return timingSafeEqual(derivedKey, storedKey);
}

export { hashPassword, verifyPassword };
