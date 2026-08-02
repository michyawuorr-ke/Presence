import { supabase } from "@/lib/supabase/client";

/** Turns a display name into a URL-safe slug base — lowercase, hyphenated,
 * stripped of anything that isn't a letter/number/hyphen. */
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40) || "user";
}

/** Generates a unique slug for /u/[slug], only called once — when a
 * profile is saved for the first time and has no slug yet. Existing slugs
 * are never regenerated on subsequent saves, even if the display name
 * changes, since the URL may already be shared/printed/scanned. */
export async function generateUniqueSlug(displayName: string, masterProfileId: string): Promise<string> {
  const base = slugify(displayName);
  let candidate = base;
  let suffix = 0;

  // Try the bare slug first, then append a short random suffix on
  // collision — checked against the real table each time rather than
  // guessing, since two people can plausibly share a name.
  while (true) {
    const { data } = await supabase
      .from("master_profiles")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data || data.id === masterProfileId) return candidate;

    suffix += 1;
    // Short random suffix rather than a plain incrementing counter — a
    // counter would leak how many name collisions exist; this doesn't.
    const rand = Math.random().toString(36).slice(2, 6);
    candidate = `${base}-${rand}`;
    if (suffix > 8) {
      // Extremely unlikely fallback — just use the id itself.
      return `${base}-${masterProfileId.slice(0, 8)}`;
    }
  }
}
