// Shared vCard 3.0 (RFC 6350) helpers used by both the owner-facing identity
// card (home/profile) and the public /u/[slug] page, so "Save Contact"
// behaves identically everywhere it appears.

export function vcardEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function toHref(url: string) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export interface VCardFields {
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

export function buildVCard(fields: VCardFields): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  lines.push(`FN:${vcardEscape(fields.name)}`);
  lines.push(`N:${vcardEscape(fields.name)};;;;`);
  if (fields.organisation) lines.push(`ORG:${vcardEscape(fields.organisation)}`);
  if (fields.role) lines.push(`TITLE:${vcardEscape(fields.role)}`);
  if (fields.phone) lines.push(`TEL;TYPE=CELL:${fields.phone.trim()}`);
  if (fields.email) lines.push(`EMAIL:${fields.email}`);
  if (fields.location) lines.push(`ADR;TYPE=WORK:;;${vcardEscape(fields.location)};;;;`);
  if (fields.portfolio) lines.push(`URL;TYPE=Portfolio:${toHref(fields.portfolio)}`);
  if (fields.website) lines.push(`URL;TYPE=Website:${toHref(fields.website)}`);
  if (fields.linkedin) lines.push(`URL;TYPE=LinkedIn:${toHref(fields.linkedin)}`);
  if (fields.note) lines.push(`NOTE:${vcardEscape(fields.note)}`);
  if (fields.oreetiUrl) lines.push(`URL;TYPE=Oreeti:${fields.oreetiUrl}`);
  lines.push("END:VCARD");
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
