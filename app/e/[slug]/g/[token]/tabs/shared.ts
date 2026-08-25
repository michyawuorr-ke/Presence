// Shared utilities and constants used across all guest experience tabs

export function getFirstName(fullName: string) {
  if (!fullName) return "Friend";
  return fullName.trim().split(" ")[0];
}

export function cleanUrl(url: string) {
  if (!url) return "";
  return url.replace(/^(https?:\/\/)?(www\.)?/, "");
}

// Stored URLs are often saved without a scheme (e.g. "linkedin.com/in/x").
// Links must have a real https:// href to be clickable — this guarantees one.
export function toHref(url: string) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// Phone numbers are self-entered in the profile form, so they show up in
// several shapes ("0712...", "+254712...", "254712...", with spaces/dashes).
// wa.me needs digits only, no leading zero, with country code. Defaults to
// Kenya (254) since that's the primary market — a number already carrying
// another country code (10+ digits after stripping) is left as-is.
export function toWhatsAppHref(phone: string) {
  if (!phone) return "";
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return "";
  let normalized = digits;
  if (normalized.startsWith("0")) normalized = "254" + normalized.slice(1);
  else if (!normalized.startsWith("254") && normalized.length <= 9) normalized = "254" + normalized;
  return `https://wa.me/${normalized}`;
}

export function parseIntents(raw: any): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export { INTENTS, INTENTS_BY_GROUP, INTENT_GROUPS, INTENT_MAP } from "@/lib/matching/intents";

export const PALETTE = {
  orange: "#E26D34",
  gold: "#D4AF37",
  umber: "#8A7355",
  obsidian: "#1C1C1E",
  linen: "#F5EFE3",
} as const;
