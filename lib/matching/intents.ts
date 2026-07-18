// ─────────────────────────────────────────────────────────────
// Intent system — grouped sub-categories, not flat labels.
// The `id` is what gets stored in guest_profiles.networking_intents.
// The `group` is the visual header in the picker.
// ─────────────────────────────────────────────────────────────

export interface Intent {
  id: string;
  label: string;         // what shows on the pill badge
  group: string;         // header grouping
  description: string;   // one-line description shown in picker
  seeking: boolean;      // true = this person wants something, false = they offer it
}

export const INTENTS: Intent[] = [
  // Capital
  { id: "Fundraising",          label: "Fundraising",            group: "Capital",      description: "Looking to raise capital for my venture",            seeking: true  },
  { id: "Investor",             label: "Investor",               group: "Capital",      description: "Deploying capital and looking for opportunities",      seeking: false },

  // Synergy
  { id: "Seeking Co-founder",   label: "Seeking Co-founder",     group: "Synergy",      description: "Looking for a co-founder to build with",              seeking: true  },
  { id: "Open to Partnerships", label: "Open to Partnerships",   group: "Synergy",      description: "Open to strategic partnerships and collaboration",     seeking: false },

  // Mentorship
  { id: "Seeking Mentorship",   label: "Seeking Mentorship",     group: "Mentorship",   description: "Looking for guidance from experienced practitioners",   seeking: true  },
  { id: "Mentoring",            label: "Mentoring",              group: "Mentorship",   description: "Available to mentor and share experience",             seeking: false },

  // Opportunities
  { id: "Open to New Roles",    label: "Open to New Roles",      group: "Opportunities","description": "Exploring career opportunities and new challenges",   seeking: true  },
  { id: "Has Opportunities",    label: "Has Opportunities",      group: "Opportunities","description": "Has roles, projects or introductions to offer",       seeking: false },
];

export const INTENT_GROUPS = ["Capital", "Synergy", "Mentorship", "Opportunities"] as const;

export const INTENT_MAP: Record<string, Intent> = Object.fromEntries(
  INTENTS.map(i => [i.id, i])
);

export const INTENTS_BY_GROUP: Record<string, Intent[]> = INTENTS.reduce(
  (acc, i) => { (acc[i.group] = acc[i.group] || []).push(i); return acc; },
  {} as Record<string, Intent[]>
);

// Complementarity: seeker + offerer in the same group = highest score.
// Seeker + seeker in same group = low. Cross-group = medium if related.
export function intentScore(intentsA: string[], intentsB: string[]): number {
  if (!intentsA.length || !intentsB.length) return 0;
  let best = 0;
  for (const a of intentsA) {
    for (const b of intentsB) {
      const iA = INTENT_MAP[a];
      const iB = INTENT_MAP[b];
      if (!iA || !iB) continue;
      let score = 0;
      if (iA.group === iB.group) {
        // Same group — seeker + offerer = perfect complement
        score = iA.seeking !== iB.seeking ? 1.0 : 0.2;
      } else {
        // Cross-group pairings that make sense
        const pair = [iA.group, iB.group].sort().join("+");
        score = ({ "Capital+Synergy": 0.6, "Mentorship+Opportunities": 0.5, "Capital+Opportunities": 0.4, "Mentorship+Synergy": 0.4 } as any)[pair] ?? 0;
      }
      best = Math.max(best, score);
    }
  }
  return best;
}

export function intentMatchReason(
  myIntents: string[],
  theirIntents: string[],
  theirName: string,
): string | null {
  if (!myIntents.length || !theirIntents.length) return null;
  let best = 0, bestA = "", bestB = "";
  for (const a of myIntents) {
    for (const b of theirIntents) {
      const iA = INTENT_MAP[a];
      const iB = INTENT_MAP[b];
      if (!iA || !iB) continue;
      const score = iA.group === iB.group && iA.seeking !== iB.seeking ? 1.0 :
                    iA.group === iB.group ? 0.2 : 0.3;
      if (score > best) { best = score; bestA = a; bestB = b; }
    }
  }
  if (best < 0.3) return null;
  const iA = INTENT_MAP[bestA];
  const iB = INTENT_MAP[bestB];
  if (!iA || !iB) return null;
  return `You're ${iA.label.toLowerCase()} and ${theirName} is ${iB.label.toLowerCase()}`;
}
