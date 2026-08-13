"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

interface TeaserEvent {
  id: string;
  title: string;
  venue: string;
  start_time: string;
  slug: string;
  status: string;
  banner_url: string | null;
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<TeaserEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("events")
        .select("id,title,venue,start_time,slug,status,banner_url")
        .eq("is_public", true)
        .in("status", ["scheduled", "live"])
        .order("start_time", { ascending: true })
        .limit(6);
      setEvents(data || []);
      setLoading(false);
    }
    load();
  }, []);

  // Nothing to show and nothing loading — don't render an empty section
  // on the homepage; the /events page itself already handles the empty
  // state for anyone who navigates there directly.
  if (!loading && events.length === 0) return null;

  return (
    <section style={{
      padding: "48px 32px",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }} data-reveal data-delay="0">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 560 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "rgba(138,115,85,0.6)", margin: "0 0 10px",
            }}>
              Happening on Oreeti
            </p>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px,3vw,32px)",
              fontWeight: 500,
              color: "var(--ivory)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              margin: "0 0 10px",
            }}>
              Find experiences worth showing up for.
            </h2>
            <p style={{ fontSize: 14, color: "var(--dusk)", lineHeight: 1.65, margin: 0 }}>
              Explore what's happening, reserve your place, and meet the people who make every gathering meaningful.
            </p>
          </div>
          <Link href="/events" style={{
            fontSize: 12.5, fontWeight: 600, color: "#E26D34", textDecoration: "none",
            letterSpacing: "0.03em", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            See all events →
          </Link>
        </div>

        {/* Horizontal strip — visible without opening the nav, matches
            the request that events not be buried behind the hamburger. */}
        <div style={{
          display: "flex", gap: 14, overflowX: "auto", paddingBottom: 6,
          scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
        }}>
          {loading
            ? [0, 1, 2].map(i => (
                <div key={i} style={{ flex: "0 0 240px", height: 180, borderRadius: 14, background: "rgba(255,255,255,0.02)", scrollSnapAlign: "start" }} />
              ))
            : events.map(event => {
                const date = event.start_time
                  ? new Date(event.start_time).toLocaleDateString("en-KE", { day: "numeric", month: "short" })
                  : "";
                return (
                  <Link key={event.id} href={`/register/${event.slug}`} style={{
                    flex: "0 0 240px", scrollSnapAlign: "start", textDecoration: "none",
                    borderRadius: 14, overflow: "hidden", background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(138,115,85,0.15)",
                  }}>
                    <div style={{
                      position: "relative", width: "100%", aspectRatio: "16 / 9",
                      background: event.banner_url ? "#000" : "linear-gradient(135deg, rgba(226,109,52,0.3), rgba(212,175,55,0.2))",
                    }}>
                      {event.banner_url ? (
                        <img src={event.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, color: "rgba(255,255,255,0.35)" }}>
                            {event.title?.trim()?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                      {event.status === "live" && new Date(event.start_time) <= new Date() && (
                        <span style={{
                          position: "absolute", top: 10, left: 10,
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                          color: "#fff", background: "rgba(34,197,94,0.9)",
                          padding: "3px 8px", borderRadius: 20,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />
                          LIVE
                        </span>
                      )}
                    </div>
                    <div style={{ padding: "12px 14px 14px" }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ivory)", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {event.title}
                      </p>
                      <p style={{ fontSize: 11.5, color: "rgba(138,115,85,0.7)", margin: 0 }}>
                        {date}{event.venue ? ` · ${event.venue}` : ""}
                      </p>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}
