// ─────────────────────────────────────────────────────────────────────────────
// Intent registry — single source of truth for all intent definitions.
// The labels here must match exactly what's stored in guest_profiles.networking_intents
// (which stores the `id` field as the value).
//
// COMPLEMENTARITY MAP: which intents pair well with which others.
// This is the core of the matching engine — not just "same intent"
// but "these two needs complete each other".
// ─────────────────────────────────────────────────────────────────────────────

export interface Intent {
  id: string;
  label: string;
  description: string;
  // When displayed in matchmaking context, what does this person offer vs seek?
  seeking: string;   // short phrase describing what they want
  offering: string;  // short phrase describing what they bring
}

export const INTENTS: Intent[] = [
  {
    id: "Capital",
    label: "Capital",
    description: "Fundraising, investors, and strategic ideas.",
    seeking: "seeking investment",
    offering: "deploying capital",
  },
  {
    id: "Synergy",
    label: "Synergy",
    description: "Collaborators, co-founders, and deep execution partnerships.",
    seeking: "seeking a co-builder",
    offering: "open to deep partnerships",
  },
  {
    id: "Mentorship",
    label: "Mentorship",
    description: "Actively seeking guidance or looking to offer perspective.",
    seeking: "seeking a mentor",
    offering: "available to mentor",
  },
  {
    id: "Opportunities",
    label: "Opportunities",
    description: "Career growth, partnerships, and introductions.",
    seeking: "open to new roles",
    offering: "has opportunities to share",
  },
];

export const INTENT_MAP: Record<string, Intent> = Object.fromEntries(
  INTENTS.map(i => [i.id, i])
);

// Which intents complement each other (bidirectional).
// A score multiplier is applied when two people have complementary intents.
export const COMPLEMENTARY_PAIRS: Array<[string, string, number]> = [
  // [intentA, intentB, score bonus 0-1]
  ["Capital",      "Capital",     0.3],  // Both fundraising/investing — relevant but not perfect
  ["Capital",      "Synergy",     0.8],  // Founder + investor pairing — high value
  ["Capital",      "Opportunities", 0.6], // Investor + career seeker — can help each other
  ["Synergy",      "Synergy",     0.7],  // Two builders — strong pairing
  ["Synergy",      "Opportunities", 0.5],
  ["Mentorship",   "Mentorship",  0.5],  // Mentor + mentee — good
  ["Mentorship",   "Capital",     0.4],
  ["Mentorship",   "Synergy",     0.5],
  ["Mentorship",   "Opportunities", 0.7], // Mentor + opportunity seeker — very natural
  ["Opportunities","Opportunities", 0.3], // Both seeking — lower value
];

// Get the complementarity score between two sets of intents (0–1)
export function intentScore(intentsA: string[], intentsB: string[]): number {
  if (!intentsA.length || !intentsB.length) return 0;

  let best = 0;
  for (const a of intentsA) {
    for (const b of intentsB) {
      for (const [pA, pB, score] of COMPLEMENTARY_PAIRS) {
        if ((a === pA && b === pB) || (a === pB && b === pA)) {
          best = Math.max(best, score);
        }
      }
    }
  }
  return best;
}

// Plain-English explanation of why two intent sets match
export function intentMatchReason(
  myIntents: string[],
  theirIntents: string[],
  theirName: string
): string | null {
  if (!myIntents.length || !theirIntents.length) return null;

  let bestScore = 0;
  let bestA = "";
  let bestB = "";

  for (const a of myIntents) {
    for (const b of theirIntents) {
      for (const [pA, pB, score] of COMPLEMENTARY_PAIRS) {
        if ((a === pA && b === pB) || (a === pB && b === pA)) {
          if (score > bestScore) {
            bestScore = score;
            bestA = a;
            bestB = b;
          }
        }
      }
    }
  }

  if (bestScore < 0.3) return null;

  const iA = INTENT_MAP[bestA];
  const iB = INTENT_MAP[bestB];
  if (!iA || !iB) return null;

  const first = myIntents.includes(bestA);
  const myAction  = first ? iA.seeking  : iA.offering;
  const theirAction = first ? iB.offering : iB.seeking;

  return `You're ${myAction} and ${theirName} is ${theirAction}`;
}
