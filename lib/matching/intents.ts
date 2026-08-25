// ─────────────────────────────────────────────────────────────
// Intent system — grouped sub-categories, not flat labels.
// The `id` is what gets stored in guest_profiles.networking_intents.
// The `group` is the visual header in the picker.
//
// Groups are ordered from most universal (fits literally any event) to
// most specific (only makes sense at some events) — this order drives the
// picker's visual order too, so the modal doesn't open on "Raising Capital"
// and prime every guest, concert-goer included, to read this as a
// business-networking tool first.
//
// Domain (arts, tech, community, etc.) intentionally does NOT live here —
// that's what the Industry field on the profile is for. Intent is about
// WHAT someone's here for, not WHO they are or WHAT WORLD they're in, so
// the same six intents apply identically whether you're at a pitch night
// or a fashion gala.
// ─────────────────────────────────────────────────────────────

export interface Intent {
  id: string;
  label: string;         // what shows on the pill badge
  group: string;         // header grouping
  description: string;   // one-line description shown in picker
  seeking: boolean;      // true = this person wants something, false = they offer it
}

export interface IntentGroupConfig {
  name: string;
  // True when two people who both picked an intent in this group are
  // themselves a good match — e.g. two people who both want collaborators,
  // or two people who both just want to meet people in the room. False for
  // groups like Capital/Mentorship, where two "seekers" don't complement
  // each other — only a seeker paired with an offerer is a real match.
  pairsWithSelf: boolean;
}

export const INTENT_GROUP_CONFIG: IntentGroupConfig[] = [
  { name: "Connect",       pairsWithSelf: true  },
  { name: "Collaborate",   pairsWithSelf: true  },
  { name: "Opportunities", pairsWithSelf: false },
  { name: "Mentorship",    pairsWithSelf: false },
  { name: "Capital",       pairsWithSelf: false },
];

export const INTENT_GROUPS: string[] = INTENT_GROUP_CONFIG.map(g => g.name);

const GROUP_PAIRS_WITH_SELF: Record<string, boolean> = Object.fromEntries(
  INTENT_GROUP_CONFIG.map(g => [g.name, g.pairsWithSelf])
);

export const INTENTS: Intent[] = [
  // Connect — works at literally any event, no ask attached. Deliberately
  // has no "offering" counterpart: wanting to meet relevant people isn't a
  // one-sided request the way funding or mentorship is, so two people who
  // both pick this are themselves the match (see pairsWithSelf above).
  // Intent selection stays fully optional at the picker level — someone at
  // a concert who's just there to enjoy the show isn't expected to pick
  // anything, and skipping is a complete, normal state, not a dead-end.
  { id: "Meet Relevant People", label: "Meet Relevant People", group: "Connect", description: "Looking to meet people relevant to your work, interests, or goals — or just curious who's in the room.", seeking: true },

  // Collaborate — merges what used to be a separate "co-founder" ask and a
  // separate "creative collaborator" ask, since underneath they're the same
  // thing: wanting people to build or work with. Both entries are
  // seeking-flavored on purpose — two people who both want collaborators
  // (a designer casting a shoot, a photographer wanting a partner) are
  // often exactly each other's match, not a mismatch.
  { id: "Seeking Collaborators", label: "Seeking Collaborators", group: "Collaborate", description: "Looking for people to work with on a project, venture, production, or creative work.", seeking: true },
  { id: "Seeking a Partner",     label: "Seeking a Partner",     group: "Collaborate", description: "Looking for a business, strategic, or venture partner.", seeking: true },

  // Opportunities
  { id: "Seeking Opportunities",  label: "Seeking Opportunities",  group: "Opportunities", description: "Looking for jobs, projects, gigs, commissions, roles, or other opportunities.", seeking: true },
  { id: "Offering Opportunities", label: "Offering Opportunities", group: "Opportunities", description: "Has roles, projects, work, introductions, or opportunities to offer.", seeking: false },

  // Mentorship
  { id: "Seeking Mentorship",  label: "Seeking Mentorship",  group: "Mentorship", description: "Looking for guidance, advice, or experience from someone further along.", seeking: true },
  { id: "Offering Mentorship", label: "Offering Mentorship", group: "Mentorship", description: "Available to guide, advise, or share experience with others.", seeking: false },

  // Capital
  { id: "Raising Capital", label: "Raising Capital", group: "Capital", description: "Looking for funding or investment for a venture, project, or organisation.", seeking: true },
  { id: "Investing",       label: "Investing",       group: "Capital", description: "Looking to invest capital in promising ventures, projects, or opportunities.", seeking: false },
];

export const INTENT_MAP: Record<string, Intent> = Object.fromEntries(
  INTENTS.map(i => [i.id, i])
);

export const INTENTS_BY_GROUP: Record<string, Intent[]> = INTENTS.reduce(
  (acc, i) => { (acc[i.group] = acc[i.group] || []).push(i); return acc; },
  {} as Record<string, Intent[]>
);

// Cross-group pairings that make sense — sorted-group-name key. Anything
// not listed here scores 0 for a cross-group pair (no meaningful overlap).
const CROSS_GROUP_SCORES: Record<string, number> = {
  "Capital+Opportunities":     0.4,
  "Collaborate+Opportunities": 0.5,
  "Collaborate+Mentorship":    0.4,
  "Mentorship+Opportunities":  0.5,
  "Collaborate+Connect":       0.3,
  "Connect+Opportunities":     0.3,
  "Connect+Mentorship":        0.3,
  "Capital+Collaborate":       0.3,
  "Capital+Connect":           0.2,
  "Capital+Mentorship":        0.2,
};

// Single source of truth for how well two intents complement each other —
// both intentScore and bestIntentPair go through this now, so they can
// never drift out of sync the way they used to (bestIntentPair previously
// used a flat 0.3 for every cross-group pair, ignoring this table).
function scorePair(a: Intent, b: Intent): number {
  if (a.group === b.group) {
    if (GROUP_PAIRS_WITH_SELF[a.group]) return 1.0;
    return a.seeking !== b.seeking ? 1.0 : 0.2;
  }
  const key = [a.group, b.group].sort().join("+");
  return CROSS_GROUP_SCORES[key] ?? 0;
}

// Complementarity: best-scoring pair across two people's full intent lists.
export function intentScore(intentsA: string[], intentsB: string[]): number {
  if (!intentsA.length || !intentsB.length) return 0;
  let best = 0;
  for (const a of intentsA) {
    for (const b of intentsB) {
      const iA = INTENT_MAP[a];
      const iB = INTENT_MAP[b];
      if (!iA || !iB) continue;
      best = Math.max(best, scorePair(iA, iB));
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
      const score = scorePair(iV, iO);
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
