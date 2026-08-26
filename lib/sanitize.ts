export function sanitizeString(input: any, maxLength: number = 255): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // strip basic XSS
}

export function sanitizePhone(input: any): string {
  if (typeof input !== 'string') return '';
  const cleaned = input.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);
  if (cleaned.startsWith("254")) return cleaned;
  return cleaned;
}

export function sanitizeAmount(input: any): number {
  const n = Number(input);
  if (isNaN(n) || n < 0 || n > 1000000) return 0;
  return Math.ceil(n);
}
