import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

// This replaces the old PKCE code-exchange flow. The magic link now points
// straight here with a token_hash, which Supabase verifies server-side
// against the raw email token — no local browser state required, so it
// works whether the link is opened in Gmail's browser, the phone's default
// browser, or the installed home-screen app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/home";

  if (token_hash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error && data.session?.user) {
      const authUserId = data.session.user.id;
      const email = data.session.user.email?.trim().toLowerCase();

      if (email) {
        const { data: existing } = await supabase
          .from("master_profiles")
          .select("id,auth_user_id")
          .eq("email", email)
          .maybeSingle();

        if (existing && !existing.auth_user_id) {
          await supabase
            .from("master_profiles")
            .update({ auth_user_id: authUserId })
            .eq("id", existing.id);
        } else if (!existing) {
          await supabase
            .from("master_profiles")
            .insert({ email, auth_user_id: authUserId });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Bad, expired, or already-used link — back to sign-in, not a dead end.
  return NextResponse.redirect(`${origin}/login?mode=login`);
}
