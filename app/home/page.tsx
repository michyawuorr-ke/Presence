"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import OreetiLogo from "@/components/OreetiLogo";
import { loadMyEvents, loadMyConnections, checkIsHost, type MyEvent, type MyConnection } from "./homeData";

type Tab = "events" | "connections";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("events");
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [connections, setConnections] = useState<MyConnection[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        router.push("/login");
        return;
      }
      const userEmail = session.user.email.toLowerCase();
      setEmail(userEmail);
      setLoading(false);

      const [ev, conn, hostStatus] = await Promise.all([
        loadMyEvents(userEmail),
        loadMyConnections(userEmail),
        checkIsHost(userEmail),
      ]);
      setEvents(ev);
      setConnections(conn);
      setIsHost(hostStatus);
      setDataLoading(false);
    }
    init();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--dusk)", fontSize: 13.5 }}>Loading...</p>
      </div>
    );
  }

  const upcoming = events.filter(e => e.status === "scheduled" || e.status === "live");
  const past = events.filter(e => e.status === "ended");

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(226,109,52,0.06), transparent), var(--base)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <OreetiLogo size="xs" />
          <button onClick={handleSignOut} style={{ background: "none", border: "none", color: "var(--ivory-muted)", fontSize: 11.5, letterSpacing: "0.04em", cursor: "pointer" }}>
            Sign Out
          </button>
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: "clamp(24px,4vw,32px)", fontWeight: 500,
          color: "var(--ivory)", letterSpacing: "-0.02em", margin: "0 0 4px",
        }}>
          Your rooms, your people.
        </h1>
        <p style={{ color: "var(--dusk)", fontSize: 13.5, margin: "0 0 32px" }}>{email}</p>

        {/* Only shown for people who already have a hosts row — per
            decision, this isn't an invitation to become a host, just a
            way back into the dashboard for people who already run events. */}
        {isHost && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 18px", borderRadius: 14, marginBottom: 32,
            background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)",
          }}>
            <p style={{ fontSize: 12.5, color: "var(--gold)", fontWeight: 600, margin: 0 }}>You host events on Oreeti</p>
            <div style={{ display: "flex", gap: 10 }}>
              <a href="/dashboard/events" style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)", textDecoration: "none", padding: "7px 12px", borderRadius: 9, border: "1px solid rgba(212,175,55,0.3)" }}>
                Dashboard
              </a>
              <a href="/dashboard/events/create" style={{ fontSize: 12, fontWeight: 600, color: "#0a0a0b", textDecoration: "none", padding: "7px 12px", borderRadius: 9, background: "var(--gold)" }}>
                + New Event
              </a>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid rgba(234,230,223,0.08)" }}>
          {(["events", "connections"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: "10px 4px", marginRight: 24, background: "none", border: "none",
                borderBottom: tab === t ? "2px solid var(--ember)" : "2px solid transparent",
                color: tab === t ? "var(--ivory)" : "var(--ivory-muted)",
                fontSize: 13, fontWeight: 600, letterSpacing: "0.02em", cursor: "pointer",
                textTransform: "capitalize",
              }}>
              {t === "events" ? "My Events" : "My Connections"}
            </button>
          ))}
        </div>

        {dataLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ height: 84, borderRadius: 14, background: "rgba(255,255,255,0.02)" }} />)}
          </div>
        ) : tab === "events" ? (
          <EventsList upcoming={upcoming} past={past} />
        ) : (
          <ConnectionsList connections={connections} />
        )}
      </div>
    </div>
  );
}

function EventsList({ upcoming, past }: { upcoming: MyEvent[]; past: MyEvent[] }) {
  if (upcoming.length === 0 && past.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <p style={{ color: "var(--dusk)", fontSize: 13.5, marginBottom: 16 }}>You haven't attended or hosted an event yet.</p>
        <a href="/events" style={{ color: "var(--ember)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Find something happening →</a>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {upcoming.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(138,115,85,0.6)", margin: "0 0 12px" }}>Upcoming</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.map(e => <EventRow key={e.id} event={e} />)}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(138,115,85,0.6)", margin: "0 0 12px" }}>Past</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {past.map(e => <EventRow key={e.id} event={e} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: MyEvent }) {
  // Hosts go to the dashboard for their own event; guests go to their
  // personal event link via the access_token they registered with.
  const href = event.is_host
    ? `/dashboard/events/${event.id}`
    : event.access_token
      ? `/e/${event.slug}/g/${event.access_token}`
      : `/register/${event.slug}`;
  const date = event.start_time
    ? new Date(event.start_time).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <a href={href} style={{
      display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14,
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0, overflow: "hidden",
        background: event.banner_url ? "#000" : "linear-gradient(135deg, rgba(226,109,52,0.3), rgba(212,175,55,0.2))",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {event.banner_url
          ? <img src={event.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "rgba(255,255,255,0.4)" }}>{event.title?.charAt(0)?.toUpperCase() || "?"}</span>}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ivory)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</p>
          {event.is_host && (
            <span style={{ fontSize: 8.5, fontWeight: 700, color: "var(--gold)", background: "rgba(212,175,55,0.1)", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.04em" }}>HOST</span>
          )}
          {event.status === "live" && (
            <span style={{ fontSize: 8.5, fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.04em" }}>LIVE</span>
          )}
        </div>
        <p style={{ fontSize: 11.5, color: "var(--dusk)", margin: "2px 0 0" }}>{date}{event.venue ? ` · ${event.venue}` : ""}</p>
      </div>
    </a>
  );
}

function ConnectionsList({ connections }: { connections: MyConnection[] }) {
  if (connections.length === 0) {
    return <p style={{ color: "var(--dusk)", fontSize: 13.5, textAlign: "center", padding: "60px 0" }}>No connections yet — they'll show up here once you meet people at an event.</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {connections.map(c => (
        <div key={c.email} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ivory)", margin: "0 0 2px" }}>{c.display_name}</p>
          {c.organisation && <p style={{ fontSize: 11.5, color: "var(--dusk)", margin: "0 0 6px" }}>{c.organisation}</p>}
          <p style={{ fontSize: 11, color: "var(--ember)", margin: 0 }}>
            {c.events_met_at.length === 1
              ? `Met at ${c.events_met_at[0].event_title}`
              : `Met at ${c.events_met_at.length} events`}
          </p>
        </div>
      ))}
    </div>
  );
}
