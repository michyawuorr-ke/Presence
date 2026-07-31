"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";

interface DirectoryEvent {
  id: string;
  title: string;
  venue: string;
  description: string;
  start_time: string;
  slug: string;
  status: string;
  banner_url: string | null;
}

export default function EventsDirectoryPage() {
  const [events, setEvents] = useState<DirectoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      // Only scheduled/live — draft events are still being set up by their
      // host and shouldn't be publicly visible yet; ended events drop off
      // the directory once they're over (a deliberate choice — this is a
      // "what's happening" surface, not an archive).
      const { data } = await supabase
        .from("events")
        .select("id,title,venue,description,start_time,slug,status,banner_url")
        .eq("is_public", true)
        .in("status", ["scheduled", "live"])
        .order("start_time", { ascending: true });
      setEvents(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = search.trim()
    ? events.filter(e =>
        e.title?.toLowerCase().includes(search.toLowerCase()) ||
        e.venue?.toLowerCase().includes(search.toLowerCase())
      )
    : events;

  return (
    <div style={{ background: "var(--base)", minHeight: "100vh" }}>
      <style>{`body { max-width: 100% !important; }`}</style>
      <Nav />

      <section style={{ padding: "160px 32px 60px", maxWidth: 900, margin: "0 auto" }}>
        <p className="eyebrow reveal" style={{ marginBottom: 20 }}>Happening on Oreeti</p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(34px,5.5vw,60px)",
          fontWeight: 500,
          color: "var(--ivory)",
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          margin: "0 0 24px",
          maxWidth: 700,
        }}
          data-reveal
        >
          A room is only as good as who's in it.
        </h1>
        <p style={{
          fontSize: 17, color: "var(--dusk)", lineHeight: 1.75, maxWidth: 520, marginBottom: 48,
        }}
          data-reveal data-delay="100"
        >
          These are the events open for anyone to walk into — no invite required, just a reason to show up. Find one, register, and see who else is in the room.
        </p>
      </section>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 32px 40px" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or venue"
          style={{
            width: "100%", padding: "14px 18px", borderRadius: 14,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--ivory)", fontSize: 15, outline: "none", marginBottom: 32,
            boxSizing: "border-box",
          }}
        />

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ height: 220, borderRadius: 16, background: "rgba(255,255,255,0.02)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ color: "var(--dusk)", fontSize: 14, textAlign: "center", padding: "60px 0" }}>
            {search ? "No events match your search." : "No public events right now — check back soon."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(event => {
              const date = event.start_time
                ? new Date(event.start_time).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" })
                : "";
              const time = event.start_time
                ? new Date(event.start_time).toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit" })
                : "";
              return (
                <a
                  key={event.id}
                  href={`/register/${event.slug}`}
                  style={{
                    display: "block", borderRadius: 16, overflow: "hidden",
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                    textDecoration: "none", transition: "border-color 0.15s ease",
                  }}
                >
                  {/* Banner — real image when the host uploaded one, otherwise
                      a gradient + initial-letter monogram so every card still
                      has visual presence rather than a blank gap. A page of
                      pure text reads as a directory listing, not something
                      that invites curiosity. */}
                  <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 7", background: event.banner_url ? "#000" : "linear-gradient(135deg, rgba(226,109,52,0.35), rgba(212,175,55,0.25))" }}>
                    {event.banner_url ? (
                      <img src={event.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 500, color: "rgba(255,255,255,0.35)" }}>
                          {event.title?.trim()?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                    {event.status === "live" && (
                      <span style={{
                        position: "absolute", top: 12, left: 12,
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                        color: "#fff", background: "rgba(34,197,94,0.9)",
                        padding: "4px 9px", borderRadius: 20,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                        LIVE NOW
                      </span>
                    )}
                  </div>

                  <div style={{ padding: "16px 20px 20px" }}>
                    <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--ivory)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {event.title}
                    </h2>
                    {event.description && (
                      <p style={{ fontSize: 13, color: "var(--dusk)", margin: "0 0 10px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {event.description}
                      </p>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 12, color: "rgba(240,237,232,0.4)" }}>
                      {date && <span>📅 {date}{time ? ` · ${time}` : ""}</span>}
                      {event.venue && <span>📍 {event.venue}</span>}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
