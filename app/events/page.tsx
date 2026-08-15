"use client";
import React, { useEffect, useMemo, useState } from "react";
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

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.animationDelay = (el.dataset.delay || "0") + "ms";
            el.classList.add("reveal");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// Deterministic, designed fallback for events with no banner image — a
// gradient plus a faint concentric-ring pattern derived from the event id,
// so every card without an image still looks distinct and intentional
// rather than a generic monogram letter.
const GRADIENT_PAIRS = [
  ["rgba(226,109,52,0.4)", "rgba(212,175,55,0.22)"],
  ["rgba(212,175,55,0.38)", "rgba(88,60,140,0.22)"],
  ["rgba(88,60,140,0.34)", "rgba(226,109,52,0.2)"],
  ["rgba(60,110,140,0.34)", "rgba(226,109,52,0.22)"],
];
function fallbackVisual(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const [a, b] = GRADIENT_PAIRS[hash % GRADIENT_PAIRS.length];
  const angle = 100 + (hash % 60);
  return { background: `linear-gradient(${angle}deg, ${a}, ${b})`, ringOffset: hash % 40 };
}

function EventCard({
  event,
  accessToken,
}: {
  event: DirectoryEvent;
  accessToken?: string;
}) {
  const date = event.start_time
    ? new Date(event.start_time).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" })
    : "";
  const time = event.start_time
    ? new Date(event.start_time).toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit" })
    : "";
  const isLive = event.status === "live" && new Date(event.start_time) <= new Date();
  const fallback = fallbackVisual(event.id);

  // The whole card is the single tap target — there's no separate "View
  // event" button anywhere. This chip is a label only, telling someone
  // what tapping the card will do next, not a second interactive element.
  const cta = accessToken
    ? { label: "Enter event", href: `/e/${event.slug}/g/${accessToken}` }
    : { label: "Register", href: `/register/${event.slug}` };

  return (
    <a
      href={cta.href}
      style={{
        display: "block", borderRadius: 16, overflow: "hidden",
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        textDecoration: "none", transition: "border-color 0.15s ease",
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 7", background: event.banner_url ? "#000" : fallback.background, overflow: "hidden" }}>
        {event.banner_url ? (
          <img src={event.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <>
            <div style={{
              position: "absolute", left: `calc(50% - ${fallback.ringOffset}px)`, top: "50%", transform: "translate(-50%,-50%)",
              width: 180, height: 180, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.14)",
            }} />
            <div style={{
              position: "absolute", left: `calc(50% + ${fallback.ringOffset}px)`, top: "50%", transform: "translate(-50%,-50%)",
              width: 120, height: 120, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)",
            }} />
          </>
        )}
        {isLive && (
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
        <span style={{
          position: "absolute", bottom: 12, right: 12,
          fontSize: 10.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.85)", background: "rgba(0,0,0,0.35)",
          padding: "5px 11px", borderRadius: 20, backdropFilter: "blur(6px)",
        }}>
          {cta.label} →
        </span>
      </div>

      <div style={{ padding: "16px 20px 20px" }}>
        {!isLive && date && (
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ember)", margin: "0 0 6px" }}>
            {date}{time ? ` · ${time}` : ""}
          </p>
        )}
        <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--ivory)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {event.title}
        </h2>
        {event.description && (
          <p style={{ fontSize: 13, color: "var(--dusk)", margin: "0 0 10px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {event.description}
          </p>
        )}
        {event.venue && (
          <p style={{ fontSize: 12, color: "rgba(240,237,232,0.4)", margin: 0 }}>{event.venue}</p>
        )}
      </div>
    </a>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ marginBottom: 20 }} data-reveal>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ember)", margin: "0 0 4px" }}>
        {eyebrow}
      </p>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--ivory)", margin: 0, letterSpacing: "-0.01em" }}>
        {title}
      </h2>
    </div>
  );
}

export default function EventsDirectoryPage() {
  useReveal();
  const [events, setEvents] = useState<DirectoryEvent[]>([]);
  const [accessByEventId, setAccessByEventId] = useState<Record<string, string>>({});
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

      // If someone's signed in, look up which of these events they're
      // already registered for, so their card can say "Enter event"
      // instead of "Register" — no guest counts or attendee data involved,
      // this only ever reflects the current visitor's own registrations.
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email?.trim().toLowerCase();
      if (email) {
        const { data: regs } = await supabase
          .from("registrations")
          .select("event_id,access_token")
          .eq("guest_email", email);
        const map: Record<string, string> = {};
        (regs || []).forEach((r: any) => {
          if (r.event_id && r.access_token) map[r.event_id] = r.access_token;
        });
        setAccessByEventId(map);
      }

      setLoading(false);
    }
    load();
  }, []);

  const now = Date.now();
  const liveEvents = useMemo(
    () => events.filter(e => e.status === "live" && new Date(e.start_time).getTime() <= now),
    [events, now]
  );
  const upcomingEvents = useMemo(
    () => events.filter(e => !(e.status === "live" && new Date(e.start_time).getTime() <= now)),
    [events, now]
  );

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
          fontSize: 17, color: "var(--dusk)", lineHeight: 1.75, maxWidth: 520, marginBottom: 0,
        }}
          data-reveal data-delay="100"
        >
          Discover events where people are gathering, connecting, and building what comes next.
        </p>
      </section>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 32px 60px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ height: 220, borderRadius: 16, background: "rgba(255,255,255,0.02)" }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p style={{ color: "var(--dusk)", fontSize: 14, textAlign: "center", padding: "60px 0" }}>
            No public events right now — check back soon.
          </p>
        ) : (
          <>
            {liveEvents.length > 0 && (
              <div style={{ marginBottom: 56 }}>
                <SectionHeading eyebrow="Live Now" title="Events happening on Oreeti right now" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {liveEvents.map(event => (
                    <EventCard key={event.id} event={event} accessToken={accessByEventId[event.id]} />
                  ))}
                </div>
              </div>
            )}

            {upcomingEvents.length > 0 && (
              <div style={{ marginBottom: 56 }}>
                <SectionHeading eyebrow="Upcoming" title="Events coming up on Oreeti" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {upcomingEvents.slice(0, 4).map(event => (
                    <EventCard key={event.id} event={event} accessToken={accessByEventId[event.id]} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <SectionHeading eyebrow="Explore All" title="Find your room" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or venue"
                data-reveal
                style={{
                  width: "100%", padding: "14px 18px", borderRadius: 14,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--ivory)", fontSize: 15, outline: "none", marginBottom: 20,
                  boxSizing: "border-box",
                }}
              />
              {filtered.length === 0 ? (
                <p style={{ color: "var(--dusk)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
                  No events match your search.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {filtered.map(event => (
                    <EventCard key={event.id} event={event} accessToken={accessByEventId[event.id]} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
