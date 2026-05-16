import crypto from 'crypto';

const SECRET = process.env.QR_SECRET || 'oreeti_qr_secret_2025_ke';

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
