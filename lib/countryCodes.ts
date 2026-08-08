/**
 * Minimal country-code table for phone inputs across the app. Adding a new
 * country later is one line here — nothing else needs to change, since
 * every phone input reads from this list rather than hardcoding a dial code.
 *
 * digitLength: expected number of digits after the dial code, for the
 * same lightweight validation the Kenya-only version used (9 digits,
 * starting with 7 or 1). leadingDigits is optional — only Kenya enforces
 * it right now since that's the only market this has been tested against;
 * leave it undefined for a country until you know its real pattern.
 */
export interface CountryCode {
  iso: string;       // "KE"
  name: string;      // "Kenya"
  dialCode: string;  // "254" — no plus sign, digits only
  digitLength: number;
  leadingDigits?: RegExp; // e.g. /^[71]/ for Kenya mobile numbers
}

export const COUNTRY_CODES: CountryCode[] = [
  { iso: "KE", name: "Kenya", dialCode: "254", digitLength: 9, leadingDigits: /^[71]/ },
  { iso: "UG", name: "Uganda", dialCode: "256", digitLength: 9 },
  { iso: "TZ", name: "Tanzania", dialCode: "255", digitLength: 9 },
  { iso: "NG", name: "Nigeria", dialCode: "234", digitLength: 10 },
  { iso: "ZA", name: "South Africa", dialCode: "27", digitLength: 9 },
  { iso: "GB", name: "United Kingdom", dialCode: "44", digitLength: 10 },
  { iso: "US", name: "United States", dialCode: "1", digitLength: 10 },
];

export const DEFAULT_COUNTRY = COUNTRY_CODES[0]; // Kenya

/** Strips a leading 0 (common when someone types 07XX instead of 7XX)
 * and any non-digit characters, then prefixes the dial code. */
export function formatPhoneWithCountry(rawInput: string, country: CountryCode): string {
  const digitsOnly = rawInput.replace(/[^\d]/g, "");
  const stripped = digitsOnly.startsWith("0") ? digitsOnly.slice(1) : digitsOnly;
  return `+${country.dialCode}${stripped}`;
}

/** Validates the digits after the dial code against that country's
 * expected length (and leading-digit pattern, where we know one). Returns
 * an error message, or null if it looks fine (or is empty — emptiness is
 * handled separately by the caller, not treated as invalid here). */
export function validatePhoneForCountry(fullValue: string, country: CountryCode): string | null {
  const digits = fullValue.replace(/[^\d]/g, "").replace(new RegExp(`^${country.dialCode}`), "");
  if (digits.length === 0) return null;
  if (country.leadingDigits && !country.leadingDigits.test(digits)) {
    return `Enter a number starting with the right prefix for ${country.name}`;
  }
  if (digits.length !== country.digitLength) {
    return `Phone number must be ${country.digitLength} digits after +${country.dialCode}`;
  }
  return null;
}
