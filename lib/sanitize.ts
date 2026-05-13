export function sanitizeString(input: any, maxLength: number = 255): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // strip basic XSS
}

export function sanitizePhone(input: any): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^0-9+]/g, '').slice(0, 15);
}

export function sanitizeAmount(input: any): number {
  const n = Number(input);
  if (isNaN(n) || n < 0 || n > 1000000) return 0;
  return Math.ceil(n);
}
