// Shared utilities and constants used across all guest experience tabs

export function getFirstName(fullName: string) {
  if (!fullName) return "Friend";
  return fullName.trim().split(" ")[0];
}

export function cleanUrl(url: string) {
  if (!url) return "";
  return url.replace(/^(https?:\/\/)?(www\.)?/, "");
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

export const REASON_OPTIONS = ["Capital", "Synergy", "Mentorship", "Opportunities"];

export const PALETTE = {
  orange: "#E26D34",
  gold: "#D4AF37",
  umber: "#8A7355",
  obsidian: "#1C1C1E",
  linen: "#F5EFE3",
} as const;
