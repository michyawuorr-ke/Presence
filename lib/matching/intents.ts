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

// Always call with the CURRENT VIEWER's own intents as `viewerIntents` and the
// OTHER PERSON's intents as `otherIntents`. The returned sentence always reads
// "You're X and <otherName> is Y" from viewerIntents' point of view — never
// store this sentence; recompute it fresh for whoever is looking at the screen.
export function intentMatchReason(
  viewerIntents: string[],
  otherIntents: string[],
  otherName: string,
): string | null {
  const pair = bestIntentPair(viewerIntents, otherIntents);
  if (!pair) return null;
  const { viewer, other } = pair;
  return `You're ${viewer.label.toLowerCase()} and ${otherName} is ${other.label.toLowerCase()}`;
}

// Finds the best-complementing intent pair between two people, viewer-first.
// Returns null if nothing scores above the relevance threshold.
export function bestIntentPair(
  viewerIntents: string[],
  otherIntents: string[],
): { viewer: Intent; other: Intent } | null {
  if (!viewerIntents.length || !otherIntents.length) return null;
  let best = 0, bestViewerId = "", bestOtherId = "";
  for (const v of viewerIntents) {
    for (const o of otherIntents) {
      const iV = INTENT_MAP[v];
      const iO = INTENT_MAP[o];
      if (!iV || !iO) continue;
      const score = iV.group === iO.group && iV.seeking !== iO.seeking ? 1.0 :
                    iV.group === iO.group ? 0.2 : 0.3;
      if (score > best) { best = score; bestViewerId = v; bestOtherId = o; }
    }
  }
  if (best < 0.3) return null;
  const iV = INTENT_MAP[bestViewerId];
  const iO = INTENT_MAP[bestOtherId];
  if (!iV || !iO) return null;
  return { viewer: iV, other: iO };
}

// Recompute a match-reason sentence from a single STORED intent id (e.g. the
// recipient's intent that a handshake request was originally sent in response
// to) plus the current viewer's own intents. Use this wherever a `reason`
// value loaded from the database is about to be displayed — never render a
// stored sentence directly, since a sentence baked at send-time is only
// correct for the sender, not for whoever is viewing it later.
export function intentReasonFromStoredIntent(
  storedIntentId: string | null | undefined,
  viewerIntents: string[],
  otherName: string,
): string | null {
  if (!storedIntentId) return null;
  const stored = INTENT_MAP[storedIntentId];
  if (!stored) return null;
  const pair = bestIntentPair(viewerIntents, [storedIntentId]);
  if (pair) {
    return `You're ${pair.viewer.label.toLowerCase()} and ${otherName} is ${pair.other.label.toLowerCase()}`;
  }
  return `${otherName} is ${stored.label.toLowerCase()}`;
}
