"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Wordmark from "@/components/Wordmark";
import EventCard, { DirectoryEvent } from "@/components/events/EventCard";
import SectionHeading from "@/components/events/SectionHeading";

export default function DiscoverPage() {
  const router = useRouter();
  const [events, setEvents] = useState<DirectoryEvent[]>([]);
  const [accessByEventId, setAccessByEventId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      // Same fields as the public Events directory, so both surfaces
      // render identical cards.
      const { data } = await supabase
        .from("events")
        .select("id,title,venue,description,start_time,slug,status,banner_url")
        .eq("is_public", true)
        .in("status", ["scheduled", "live"])
        .order("start_time", { ascending: true })
        .limit(50);
      setEvents(data || []);

      const email = session.user?.email?.trim().toLowerCase();
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
  }, [router]);

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
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(226,109,52,0.06), transparent), var(--base)" }}>
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "28px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <a href="/home" style={{ color: "var(--dusk)", fontSize: 12, textDecoration: "none" }}>Back</a>
          <Wordmark />
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,4vw,26px)", fontWeight: 500, color: "var(--ivory)", letterSpacing: "-0.02em", margin: "0 0 4px" }}>
          Discover Events
        </h1>
        <p style={{ color: "var(--dusk)", fontSize: 13, margin: "0 0 28px" }}>Upcoming and live events on Oreeti.</p>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ height: 88, borderRadius: 14, background: "rgba(255,255,255,0.02)" }} />)}
          </div>
        ) : events.length === 0 ? (
          <p style={{ color: "var(--dusk)", fontSize: 13.5, textAlign: "center", padding: "60px 0" }}>No public events right now. Check back soon.</p>
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
                    <div key={event.id} style={{ flex: "0 0 180px", scrollSnapAlign: "start" }}>
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
                    <div key={event.id} style={{ flex: "0 0 180px", scrollSnapAlign: "start" }}>
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
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--ivory)", fontSize: 14, outline: "none", marginBottom: 16,
                  boxSizing: "border-box",
                }}
              />
              {filtered.length === 0 ? (
                <p style={{ color: "var(--dusk)", fontSize: 13.5, textAlign: "center", padding: "40px 0" }}>
                  No events match your search.
                </p>
              ) : (
                <div style={{
                  display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4,
                  scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
                }}>
                  {filtered.map(event => (
                    <div key={event.id} style={{ flex: "0 0 180px", scrollSnapAlign: "start" }}>
                      <EventCard event={event} accessToken={accessByEventId[event.id]} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
