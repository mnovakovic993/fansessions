import crypto from 'node:crypto';

function key(name) {
  const raw = process.env[name];
  if (!raw || raw.length < 32) throw new Error(`${name} must be set to at least 32 characters`);
  return crypto.createHash('sha256').update(raw).digest();
}

// AES-256-GCM encryption for Fanvue tokens stored in the database.
export function encrypt(text) {
  if (text == null) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key('TOKEN_ENCRYPTION_KEY'), iv);
  const enc = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString('base64url')).join('.');
}

export function decrypt(payload) {
  if (!payload) return null;
  const [iv, tag, enc] = payload.split('.').map((s) => Buffer.from(s, 'base64url'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key('TOKEN_ENCRYPTION_KEY'), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

// Signed values for cookies: "<base64url json>.<hmac>".
export function sign(obj) {
  const body = Buffer.from(JSON.stringify(obj)).toString('base64url');
  const mac = crypto.createHmac('sha256', key('SESSION_SECRET')).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function unsign(value) {
  if (!value || !value.includes('.')) return null;
  const [body, mac] = value.split('.');
  const expected = crypto.createHmac('sha256', key('SESSION_SECRET')).update(body).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (obj.exp && Date.now() > obj.exp) return null;
    return obj;
  } catch {
    return null;
  }
}

export function randomString(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function pkceChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}
