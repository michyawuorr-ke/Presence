"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

const tabs = [
  { label: "Events", path: "/dashboard/events" },
  { label: "Tickets", path: "/dashboard/tickets" },
  { label: "Live", path: "/dashboard/live" },
  { label: "Report", path: "/dashboard/report" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/login");
    });
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* Top Navigation */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: "0 20px",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "56px",
        }}>
          <p style={{
            fontSize: "11px",
            letterSpacing: "0.25em",
            color: "#999",
            textTransform: "uppercase",
          }}>
            Presence
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            style={{
              fontSize: "12px",
              color: "#999",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: "4px",
          paddingBottom: "12px",
        }}>
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => router.push(tab.path)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "12px",
                  border: "none",
                  background: active ? "#000" : "transparent",
                  color: active ? "#fff" : "#999",
                  fontSize: "13px",
                  fontWeight: active ? "500" : "400",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingTop: "120px", padding: "120px 20px 40px" }}>
        {children}
      </div>
    </div>
  );
}
