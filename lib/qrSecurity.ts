import crypto from 'crypto';

const isProd = process.env.NODE_ENV === 'production';

if (!process.env.QR_SECRET && isProd) {
  throw new Error(
    'QR_SECRET environment variable is not set. QR signing must use a secret ' +
    'that is never committed to source control. Set QR_SECRET in your production ' +
    'environment before deploying.'
  );
}

if (!process.env.QR_SECRET && !isProd) {
  // eslint-disable-next-line no-console
  console.warn(
    '[qrSecurity] QR_SECRET is not set. Using an insecure development-only ' +
    'fallback. This is fine for local testing but MUST be set via env var ' +
    'before deploying to production.'
  );
}

const SECRET = process.env.QR_SECRET || 'dev-only-insecure-qr-secret-do-not-deploy';

export function signQRPayload(payload: string): string {
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payload);
  const sig = hmac.digest('hex').slice(0, 16);
  return `${payload}:${sig}`;
}

export function verifyQRPayload(signed: string, prefix: string): string | null {
  if (!signed.startsWith(prefix)) return null;
  const lastColon = signed.lastIndexOf(':');
  if (lastColon === -1) return null;
  const payload = signed.slice(0, lastColon);
  const sig = signed.slice(lastColon + 1);
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payload);
  const expected = hmac.digest('hex').slice(0, 16);
  if (sig !== expected) return null;
  const id = payload.replace(prefix, '');
  return id;
}
