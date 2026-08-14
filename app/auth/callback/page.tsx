"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Signing in...");
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let redirected = false;

    async function finish(session: any) {
      if (redirected) return;
      redirected = true;

      const authUserId = session.user.id;
      const email = session.user.email?.trim().toLowerCase();
      if (!email) { router.push("/home"); return; }

      setStatus("Setting up your account...");

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

      // iOS "Add to Home Screen" installs run in a storage context that's
      // isolated from Safari — a session created here (a plain browser
      // tab, opened from the Gmail app) won't be visible from the home
      // screen icon. Flag that so /home can tell the person to finish by
      // opening the app from their home screen, instead of them silently
      // hitting the login screen again next time.
      const isStandalone =
        typeof window !== "undefined" &&
        (window.matchMedia?.("(display-mode: standalone)").matches ||
          (window.navigator as any).standalone === true);

      router.push(isStandalone ? "/home" : "/home?fromBrowser=1");
    }

    async function handleCallback() {
      // PKCE flow — code in query param
      const code = searchParams.get("code");
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.session) {
          await finish(data.session);
          return;
        }
      }

      // Magic link flow — token in fragment, use onAuthStateChange
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === "SIGNED_IN" && session?.user && !redirected) {
            subscription.unsubscribe();
            clearTimeout(fallbackTimer);
            await finish(session);
          }
        }
      );

      // Check if session already exists (user clicked link twice)
      const { data: { session } } = await supabase.auth.getSession();

      let fallbackTimer: ReturnType<typeof setTimeout>;

      if (session?.user && !redirected) {
        subscription.unsubscribe();
        await finish(session);
        return;
      }

      fallbackTimer = setTimeout(() => {
        if (!redirected) {
          redirected = true;
          subscription.unsubscribe();
          router.push("/login");
        }
      }, 8000);
    }

    handleCallback();
  }, [router, searchParams]);

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(226,109,52,0.08), transparent), var(--base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ember)", opacity: dots.length > i ? 1 : 0.2, transition: "opacity 0.3s" }} />
          ))}
        </div>
        <p style={{ color: "var(--dusk)", fontSize: 13 }}>{status}</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "var(--base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--dusk)", fontSize: 13 }}>Signing in...</p>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
