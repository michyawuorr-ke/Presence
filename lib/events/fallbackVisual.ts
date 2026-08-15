// Deterministic, designed fallback for events with no banner image — a
// gradient derived from the event id, so every event without an image
// still looks distinct and intentional rather than one flat static color
// or a bare initial letter. Shared between the public Events directory
// and the in-app Discover Events list so both look consistent.
const GRADIENT_PAIRS = [
  ["rgba(226,109,52,0.4)", "rgba(212,175,55,0.22)"],
  ["rgba(212,175,55,0.38)", "rgba(88,60,140,0.22)"],
  ["rgba(88,60,140,0.34)", "rgba(226,109,52,0.2)"],
  ["rgba(60,110,140,0.34)", "rgba(226,109,52,0.22)"],
];

export function fallbackVisual(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const [a, b] = GRADIENT_PAIRS[hash % GRADIENT_PAIRS.length];
  const angle = 100 + (hash % 60);
  return { background: `linear-gradient(${angle}deg, ${a}, ${b})`, ringOffset: hash % 40 };
}
