"use client";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import EventCard, { DirectoryEvent } from "@/components/events/EventCard";
import SectionHeading from "@/components/events/SectionHeading";

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

      <section style={{ padding: "76px 32px 60px", maxWidth: 900, margin: "0 auto" }}>
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

      <div style={{ maxWidth: 400, margin: "0 auto", padding: "0 32px 60px" }}>
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
              <div style={{ marginBottom: 40 }}>
                <SectionHeading eyebrow="Live Now" />
                <div style={{
                  display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4,
                  scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
                }}>
                  {liveEvents.map(event => (
                    <div key={event.id} style={{ flex: "0 0 200px", scrollSnapAlign: "start" }}>
                      <EventCard event={event} accessToken={accessByEventId[event.id]} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {upcomingEvents.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <SectionHeading eyebrow="Upcoming" />
                <div style={{
                  display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4,
                  scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
                }}>
                  {upcomingEvents.slice(0, 8).map(event => (
                    <div key={event.id} style={{ flex: "0 0 200px", scrollSnapAlign: "start" }}>
                      <EventCard event={event} accessToken={accessByEventId[event.id]} />
                    </div>
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
                <div style={{
                  display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4,
                  scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
                }}>
                  {filtered.map(event => (
                    <div key={event.id} style={{ flex: "0 0 200px", scrollSnapAlign: "start" }}>
                      <EventCard event={event} accessToken={accessByEventId[event.id]} />
                    </div>
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
