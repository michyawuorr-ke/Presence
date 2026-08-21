import { createClient } from "@supabase/supabase-js";

// DB-backed, not in-memory — a plain in-process Map doesn't work across
// Vercel's separate serverless instances, so under real concurrent load
// (many people hitting the same endpoint around the same time at an
// event) the old version wasn't actually enforcing anything. This uses
// an atomic Postgres function (check_rate_limit) so the count is shared
// and correct no matter which instance handles the request.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: Math.round(windowMs / 1000),
  });

  if (error) {
    // If the rate limiter itself is down, fail open rather than blocking
    // every registration/check-in at a live event over an infra hiccup —
    // but log it, since silent failures here are exactly how the old
    // in-memory version's gap went unnoticed.
    console.error("Rate limit check failed:", error);
    return true;
  }

  return data === true;
}
