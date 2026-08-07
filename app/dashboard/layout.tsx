"use client";
import Wordmark from "@/components/Wordmark";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [initials, setInitials] = useState("O");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("host_profiles").select("display_name").eq("host_id", user.id).maybeSingle()
        .then(({ data }) => {
          if (data?.display_name) setInitials(data.display_name.charAt(0).toUpperCase());
        });
    });
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", fontFamily: "var(--font-inter)" }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(10,10,12,0.92)", backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.03), 0 4px 16px rgba(0,0,0,0.3)",
        padding: "0 20px", maxWidth: "480px", margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "52px" }}>
          <p style={{ fontSize: "19px", fontWeight: "700", letterSpacing: "-0.03em", fontFamily: "'Helvetica Neue',Arial,sans-serif", margin: 0 }}>
            <Wordmark />
          </p>

          {/* Avatar button — opens profile menu */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowProfileMenu(p => !p)}
              style={{
                width: "34px", height: "34px", borderRadius: "50%",
                background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)",
                color: "#D4AF37", fontSize: "13px", fontWeight: "700",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {initials}
            </button>

            {showProfileMenu && (
              <>
                <div onClick={() => setShowProfileMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
                <div style={{
                  position: "absolute", top: "42px", right: 0, zIndex: 20,
                  background: "#141416", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "14px", padding: "6px", minWidth: "160px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}>
                  <button
                    onClick={() => { setShowProfileMenu(false); router.push("/dashboard/profile"); }}
                    style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", color: "#f0ede8", fontSize: "13px", cursor: "pointer", borderRadius: "8px" }}
                  >
                    Edit Profile
                  </button>
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "4px 0" }} />
                  <button
                    onClick={handleSignOut}
                    style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", color: "rgba(248,113,113,0.7)", fontSize: "13px", cursor: "pointer", borderRadius: "8px" }}
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Only show nav tabs when not inside an event detail page */}
        {!pathname.match(/\/dashboard\/events\/[^/]+/) && (
          <div style={{ display: "flex", gap: "2px", paddingBottom: "10px" }}>
            {[{ label: "Events", path: "/dashboard/events" }].map(tab => {
              const active = pathname.startsWith(tab.path);
              return (
                <button key={tab.path} onClick={() => router.push(tab.path)} style={{
                  padding: "7px 18px", borderRadius: "10px", border: "none",
                  background: active ? "rgba(212,175,55,0.1)" : "transparent",
                  color: active ? "#D4AF37" : "rgba(255,255,255,0.4)",
                  fontSize: "13px", fontWeight: active ? "600" : "400",
                  cursor: "pointer", transition: "all 0.15s",
                  boxShadow: active ? "inset 0 0 0 1px rgba(212,175,55,0.15)" : "none",
                }}>{tab.label}</button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ paddingTop: "80px", padding: "80px 0 48px" }}>
        {children}
      </div>
    </div>
  );
}
