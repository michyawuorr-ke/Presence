"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import Wordmark from "@/components/Wordmark";

interface TeaserEvent {
  id: string; title: string; venue: string;
  start_time: string; slug: string; status: string; banner_url: string | null;
}

export default function DiscoverPage() {
  const router = useRouter();
  const [events, setEvents] = useState<TeaserEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
    });
    supabase.from("events")
      .select("id,title,venue,start_time,slug,status,banner_url")
      .eq("is_public", true)
      .in("status", ["scheduled", "live"])
      .order("start_time", { ascending: true })
      .limit(20)
      .then(({ data }) => { setEvents(data || []); setLoading(false); });
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(226,109,52,0.06), transparent), var(--base)" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <Wordmark />
          <a href="/home" style={{ color: "var(--dusk)", fontSize: 12, textDecoration: "none" }}>← Back</a>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,4vw,26px)", fontWeight: 500, color: "var(--ivory)", letterSpacing: "-0.02em", margin: "0 0 4px" }}>
          Discover Events
        </h1>
        <p style={{ color: "var(--dusk)", fontSize: 13, margin: "0 0 28px" }}>Upcoming and live events on Oreeti.</p>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[0,1,2].map(i => <div key={i} style={{ height: 88, borderRadius: 14, background: "rgba(255,255,255,0.02)" }} />)}
          </div>
        ) : events.length === 0 ? (
          <p style={{ color: "var(--dusk)", fontSize: 13.5, textAlign: "center", padding: "60px 0" }}>No public events right now. Check back soon.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {events.map(event => {
              const date = event.start_time
                ? new Date(event.start_time).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" })
                : "";
              return (
                <Link key={event.id} href={`/register/${event.slug}`} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                  borderRadius: 14, background: "linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
                  border: "1px solid rgba(255,255,255,0.07)", textDecoration: "none",
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, flexShrink: 0, overflow: "hidden",
                    background: event.banner_url ? "#000" : "linear-gradient(135deg, rgba(226,109,52,0.3), rgba(212,175,55,0.2))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {event.banner_url
                      ? <img src={event.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>{event.title?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 3px", fontSize: 13.5, fontWeight: 600, color: "var(--ivory)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</p>
                    <p style={{ margin: 0, fontSize: 11.5, color: "var(--dusk)" }}>{date}{event.venue ? ` · ${event.venue}` : ""}</p>
                  </div>
                  {event.status === "live"
                    ? <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", padding: "3px 8px", borderRadius: 20, flexShrink: 0 }}>LIVE</span>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.2} style={{ flexShrink: 0, color: "var(--ivory)" }}><path d="M9 18l6-6-6-6"/></svg>
                  }
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
