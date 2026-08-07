/**
 * Minimal vCard 3.0 builder. Only includes fields that were actually
 * passed in (respecting the same show/hide toggles as the card itself),
 * so "Save Contact" never leaks something the person chose to hide.
 */
export interface VCardInput {
  name: string;
  organisation?: string | null;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  portfolio?: string | null;
  website?: string | null;
  linkedin?: string | null;
  note?: string | null;
  oreetiUrl?: string | null;
}

function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function buildVCard(input: VCardInput): string {
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];

  lines.push(`FN:${escapeVCardValue(input.name)}`);
  // N: Family;Given;Middle;Prefix;Suffix — we only have a full name, so
  // put it all in "Given" rather than guessing at a split.
  lines.push(`N:;${escapeVCardValue(input.name)};;;`);

  if (input.organisation) lines.push(`ORG:${escapeVCardValue(input.organisation)}`);
  if (input.role) lines.push(`TITLE:${escapeVCardValue(input.role)}`);
  if (input.phone) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(input.phone)}`);
  if (input.email) lines.push(`EMAIL:${escapeVCardValue(input.email)}`);
  if (input.location) lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(input.location)};;;;`);
  if (input.website) lines.push(`URL;TYPE=Website:${escapeVCardValue(input.website)}`);
  if (input.portfolio) lines.push(`URL;TYPE=Portfolio:${escapeVCardValue(input.portfolio)}`);
  if (input.linkedin) lines.push(`URL;TYPE=LinkedIn:${escapeVCardValue(input.linkedin)}`);
  if (input.oreetiUrl) lines.push(`URL;TYPE=Oreeti:${escapeVCardValue(input.oreetiUrl)}`);
  if (input.note) lines.push(`NOTE:${escapeVCardValue(input.note)}`);

  lines.push("END:VCARD");
  // vCard spec requires CRLF line endings.
  return lines.join("\r\n");
}

export function downloadVCardFile(vcard: string, filename: string) {
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
