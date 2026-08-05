"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Signing in...");

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("exchangeCodeForSession error:", error.message);
          router.push("/login");
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }

      const authUserId = session.user.id;
      const email = session.user.email?.trim().toLowerCase();

      if (!email) {
        router.push("/home");
        return;
      }

      const { data: existing } = await supabase
        .from("master_profiles")
        .select("id,auth_user_id")
        .eq("email", email)
        .maybeSingle();

      if (existing && !existing.auth_user_id) {
        setStatus("Linking your event history...");
        await supabase
          .from("master_profiles")
          .update({ auth_user_id: authUserId })
          .eq("id", existing.id);
      } else if (!existing) {
        await supabase
          .from("master_profiles")
          .insert({ email, auth_user_id: authUserId });
      }

      router.push("/home");
    }

    handleCallback();
  }, [router, searchParams]);

  return (
    <p style={{ color: "var(--dusk)", fontSize: 13.5 }}>{status}</p>
  );
}

export default function AuthCallback() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(226,109,52,0.08), transparent), var(--base)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <Suspense fallback={<p style={{ color: "var(--dusk)", fontSize: 13.5 }}>Signing in...</p>}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
