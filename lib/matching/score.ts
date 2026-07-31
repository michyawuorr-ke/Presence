// ─────────────────────────────────────────────────────────────────────────────
// Matchmaking scoring engine — pure TypeScript, zero API calls, zero cost.
// Runs in the browser against data already fetched for the networking tab.
//
// SCORE BREAKDOWN (total = 0–100):
//   Intent complementarity    — 40 pts  (most important signal)
//   Station proximity         — 20 pts  (people nearby are easier to meet)
//   Role complementarity      — 20 pts  (org/role signals value alignment)
//   Behavioural signals       — 20 pts  (prior interaction = warmer connection)
// ─────────────────────────────────────────────────────────────────────────────

import { parseIntents } from "@/app/e/[slug]/g/[token]/tabs/shared";
import { intentScore, intentMatchReason } from "./intents";

export interface AttendeeProfile {
  id: string;
  display_name: string;
  role_title?: string;
  organisation?: string;
  industry?: string;
  bio?: string;
  networking_intents: any; // raw from DB, will be parsed
  target_station_id?: string;
  aura_active?: boolean;
  networking_visible?: boolean;
  role?: string;
  role_badge?: string;
  role_label?: string;
}

export interface InteractionMap {
  // guest_profile ids already connected/requested/ignored
  connectedIds: Set<string>;
  requestedIds: Set<string>;
  declinedIds: Set<string>;
  blockedIds: Set<string>;
}

export interface MatchResult {
  profile: AttendeeProfile;
  score: number;            // 0–100
  reasons: string[];        // human-readable explanations
  intentReason: string | null;
  breakdown: {
    intent: number;
    station: number;
    role: number;
    behaviour: number;
  };
}

// ── Role complementarity ─────────────────────────────────────────────────────
// Broad role clusters — same cluster = peers (moderate score),
// different but related clusters = complementary (high score).
const ROLE_CLUSTERS: Record<string, string> = {
  // Founders / builders
  founder: "builder", ceo: "builder", cto: "builder", cofounder: "builder",
  "co-founder": "builder", entrepreneur: "builder", "product manager": "builder",
  pm: "builder", engineer: "builder", developer: "builder",
  // Finance / capital
  investor: "capital", "venture capitalist": "capital", vc: "capital",
  analyst: "capital", banker: "capital", "fund manager": "capital",
  // Creative / design
  designer: "creative", architect: "creative", filmmaker: "creative",
  journalist: "creative", writer: "creative",
  // Operations / management
  director: "ops", manager: "ops", "operations manager": "ops",
  consultant: "ops", advisor: "ops",
  // Academia / research
  researcher: "academia", professor: "academia", phd: "academia",
  lecturer: "academia",
};

function getCluster(roleTitle?: string): string {
  if (!roleTitle) return "unknown";
  const lower = roleTitle.toLowerCase();
  for (const [keyword, cluster] of Object.entries(ROLE_CLUSTERS)) {
    if (lower.includes(keyword)) return cluster;
  }
  return "unknown";
}

const CLUSTER_COMPATIBILITY: Record<string, Record<string, number>> = {
  builder:  { builder: 12, capital: 18, creative: 10, ops: 8, academia: 6 },
  capital:  { builder: 18, capital: 8,  creative: 5,  ops: 10, academia: 6 },
  creative: { builder: 10, capital: 5,  creative: 10, ops: 8,  academia: 8 },
  ops:      { builder: 8,  capital: 10, creative: 8,  ops: 6,  academia: 5 },
  academia: { builder: 6,  capital: 6,  creative: 8,  ops: 5,  academia: 8 },
};

function roleScore(myRole?: string, theirRole?: string): number {
  const myCluster    = getCluster(myRole);
  const theirCluster = getCluster(theirRole);
  if (myCluster === "unknown" || theirCluster === "unknown") return 5;
  return CLUSTER_COMPATIBILITY[myCluster]?.[theirCluster] ?? 5;
}

// ── Main scoring function ─────────────────────────────────────────────────────
export function scoreMatch(
  me: AttendeeProfile,
  them: AttendeeProfile,
  interactions: InteractionMap,
  sameOrg: boolean = false,
): MatchResult {
  const myIntents   = parseIntents(me.networking_intents);
  const theirIntents = parseIntents(them.networking_intents);

  // Intent complementarity (0–40)
  const rawIntent = intentScore(myIntents, theirIntents);
  const intentPts = Math.round(rawIntent * 40);

  // Station proximity (0–20)
  // Same station = full points, no station = partial
  let stationPts = 0;
  if (me.target_station_id && them.target_station_id) {
    stationPts = me.target_station_id === them.target_station_id ? 20 : 5;
  } else {
    stationPts = 8; // no station info — neutral
  }

  // Role complementarity (0–20)
  let rolePts = Math.min(20, roleScore(me.role_title, them.role_title));

  // Behavioural signals (0–20)
  let behaviourPts = 0;
  if (interactions.connectedIds.has(them.id))  behaviourPts -= 20; // already connected — skip
  if (interactions.requestedIds.has(them.id))  behaviourPts -= 10; // already requested
  if (interactions.declinedIds.has(them.id))   behaviourPts -= 15; // they declined us
  if (interactions.blockedIds.has(them.id))    behaviourPts -= 20; // blocked
  // No prior interaction = fresh opportunity
  if (behaviourPts === 0) behaviourPts = 10;
  behaviourPts = Math.max(0, Math.min(20, behaviourPts + 10));

  // Same industry = shared context, small bonus to role score
  if (me.industry && them.industry && me.industry === them.industry) {
    rolePts = Math.min(20, rolePts + 5);
  }

  // Penalise same org — they can meet any time, event is for cross-pollination
  if (sameOrg) stationPts = Math.round(stationPts * 0.4);

  const total = Math.min(100, intentPts + stationPts + rolePts + behaviourPts);

  // ── Reasons ────────────────────────────────────────────────────────────────
  const reasons: string[] = [];
  const theirFirst = them.display_name?.split(" ")[0] ?? "them";

  // scoreMatch(me, them, ...) — `me` is always the viewer this ranked list is
  // being built for, so myIntents is the viewer's own intents here.
  const intentReason = intentMatchReason(myIntents, theirIntents, theirFirst);
  if (intentReason) reasons.push(intentReason);

  if (!intentReason && theirIntents.length) {
    reasons.push(`${theirFirst} is here for ${theirIntents.join(" + ")}`);
  }

  const myCluster    = getCluster(me.role_title);
  const theirCluster = getCluster(them.role_title);
  if (myCluster !== "unknown" && theirCluster !== "unknown" && myCluster !== theirCluster) {
    if ((myCluster === "builder" && theirCluster === "capital") ||
        (myCluster === "capital" && theirCluster === "builder")) {
      reasons.push(`${theirFirst} is ${theirCluster === "capital" ? "in finance" : "building something"}`);
    }
  }

  if (me.target_station_id && them.target_station_id &&
      me.target_station_id === them.target_station_id) {
    reasons.push("You're at the same station");
  }

  return {
    profile: them,
    score: total,
    reasons,
    intentReason,
    breakdown: { intent: intentPts, station: stationPts, role: rolePts, behaviour: behaviourPts },
  };
}

// ── Rank a full attendee list against one person ──────────────────────────────
export function rankMatches(
  me: AttendeeProfile,
  others: AttendeeProfile[],
  interactions: InteractionMap,
  topN: number = 10,
): MatchResult[] {
  const myOrg = me.organisation?.toLowerCase().trim();

  return others
    .filter(p =>
      p.id !== me.id &&
      !interactions.blockedIds.has(p.id) &&
      !interactions.connectedIds.has(p.id) // already connected — don't re-suggest
    )
    .map(p => {
      const sameOrg = !!(myOrg && p.organisation?.toLowerCase().trim() === myOrg);
      return scoreMatch(me, p, interactions, sameOrg);
    })
    .filter(r => r.score > 20) // minimum relevance threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

// requestIdleCallback isn't available in Safari/WebKit (including iOS), so
// this falls back to setTimeout there. setTimeout doesn't wait for actual
// browser idle time the way requestIdleCallback does — it just yields one
// tick — so the responsiveness gain on Safari is smaller, but it's still a
// real yield back to the main thread between chunks rather than one long
// synchronous block.
function yieldToMain(): Promise<void> {
  return new Promise(resolve => {
    if (typeof (window as any).requestIdleCallback === "function") {
      (window as any).requestIdleCallback(() => resolve(), { timeout: 50 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

// ── Chunked ranking — same result as rankMatches, but processes attendees
// in batches and yields to the main thread between them. At small attendee
// counts this is barely distinguishable from the synchronous version; the
// point is events with 300+ attendees, where scoring everyone in one
// unbroken pass visibly blocks the UI on lower-end Android devices.
// Total work done is the same — this trades a longer wall-clock time for
// the browser staying responsive to touch/scroll while it runs.
export async function rankMatchesChunked(
  me: AttendeeProfile,
  others: AttendeeProfile[],
  interactions: InteractionMap,
  topN: number = 10,
  chunkSize: number = 40,
): Promise<MatchResult[]> {
  const myOrg = me.organisation?.toLowerCase().trim();
  const candidates = others.filter(p =>
    p.id !== me.id &&
    !interactions.blockedIds.has(p.id) &&
    !interactions.connectedIds.has(p.id)
  );

  const results: MatchResult[] = [];
  for (let i = 0; i < candidates.length; i += chunkSize) {
    const chunk = candidates.slice(i, i + chunkSize);
    for (const p of chunk) {
      const sameOrg = !!(myOrg && p.organisation?.toLowerCase().trim() === myOrg);
      results.push(scoreMatch(me, p, interactions, sameOrg));
    }
    // Yield after every chunk except when we've just processed the last one
    // — no point yielding right before returning.
    if (i + chunkSize < candidates.length) await yieldToMain();
  }

  return results
    .filter(r => r.score > 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
