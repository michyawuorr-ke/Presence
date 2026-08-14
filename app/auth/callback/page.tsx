"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { completeSignIn } from "@/lib/auth/completeSignIn";

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
      setStatus("Setting up your account...");
      const destination = await completeSignIn(session);
      router.push(destination);
    }

    async function handleCallback() {
      // PKCE flow — code in query param. This only succeeds if it's opened
      // in the same browser/app instance that requested it (the code
      // verifier is stored locally there). Opening the link from Gmail
      // often lands in a different instance — that's expected to fail
      // here, not a bug; the login page's 6-digit code covers that case.
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

      // Don't wait the full 8s in the cross-context-failure case — the
      // code path failed above, so waiting here just delays getting the
      // person back to where they can use the 6-digit code instead.
      fallbackTimer = setTimeout(() => {
        if (!redirected) {
          redirected = true;
          subscription.unsubscribe();
          router.push("/login?mode=login");
        }
      }, code ? 1500 : 8000);
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
