"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Signing in...");

  useEffect(() => {
    async function handleCallback() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }

      const authUserId = session.user.id;
      const email = session.user.email?.trim().toLowerCase();

      if (!email) {
        // Shouldn't happen with the email-OTP flow, but fail safe rather
        // than proceed with a claim step that has nothing to match on.
        router.push("/home");
        return;
      }

      // Claim or create the master_profiles row for this login. This is
      // the actual bridge between "guest at some event via an access
      // token" and "a real logged-in identity" — auth_user_id was always
      // a nullable column on master_profiles, unused until now.
      const { data: existing } = await supabase
        .from("master_profiles")
        .select("id,auth_user_id")
        .eq("email", email)
        .maybeSingle();

      if (existing && !existing.auth_user_id) {
        // Found a master_profiles row from prior guest activity
        // (onboarding at some event), never claimed by a real login —
        // claim it now so their history carries forward.
        setStatus("Linking your event history...");
        await supabase
          .from("master_profiles")
          .update({ auth_user_id: authUserId })
          .eq("id", existing.id);
      } else if (!existing) {
        // No prior guest activity at all — first-ever contact with
        // Oreeti via login rather than an event link. Create a bare
        // profile now so master_profiles is still the single source of
        // truth for this identity, not a special-cased empty state.
        await supabase
          .from("master_profiles")
          .insert({ email, auth_user_id: authUserId });
      }
      // else: existing.auth_user_id is already set (either to this user
      // or, in a rare edge case, someone else's old session) — leave it
      // alone rather than overwrite silently.

      router.push("/home");
    }

    handleCallback();
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(226,109,52,0.08), transparent), var(--base)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <p style={{ color: "var(--dusk)", fontSize: 13.5 }}>{status}</p>
    </div>
  );
}
