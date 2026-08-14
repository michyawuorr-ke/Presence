import { createBrowserClient } from "@supabase/ssr";

// Explicit long-lived cookie so a returning visit doesn't depend on
// library defaults. 400 days is the maximum Chrome/most browsers allow.
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: SESSION_COOKIE_MAX_AGE,
        sameSite: "lax",
        secure: true,
      },
    }
  );
}

export const supabase = createClient();