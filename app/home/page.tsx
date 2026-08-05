"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import OreetiMark from "@/components/OreetiMark";
import {
  loadMyEvents, loadMyConnections, checkIsHost,
  loadArchivedEventIds, archiveEvent, unarchiveEvent,
  type MyEvent, type MyConnection,
} from "./homeData";

type Tab = "events" | "connections";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("events");
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [connections, setConnections] = useState<MyConnection[]>([]);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [search, setSearch] = useState("");

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

      const [ev, conn, hostStatus, archived] = await Promise.all([
        loadMyEvents(userEmail),
        loadMyConnections(userEmail),
        checkIsHost(userEmail),
        loadArchivedEventIds(userEmail),
      ]);
      setEvents(ev);
      setConnections(conn);
      setIsHost(hostStatus);
      setArchivedIds(archived);
      setDataLoading(false);
    }
    init();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleToggleArchive(eventId: string) {
    if (!email) return;
    const isArchived = archivedIds.has(eventId);
    // Optimistic update — archiving is a low-stakes, reversible action, no
    // need to wait on the network before reflecting it.
    setArchivedIds(prev => {
      const next = new Set(prev);
      isArchived ? next.delete(eventId) : next.add(eventId);
      return next;
    });
    if (isArchived) await unarchiveEvent(email, eventId);
    else await archiveEvent(email, eventId);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--dusk)", fontSize: 13.5 }}>Loading...</p>
      </div>
    );
  }

  const visibleEvents = showArchived ? events : events.filter(e => !archivedIds.has(e.id));
  const searched = search.trim()
    ? visibleEvents.filter(e => e.title?.toLowerCase().includes(search.toLowerCase()) || e.venue?.toLowerCase().includes(search.toLowerCase()))
    : visibleEvents;
  const upcoming = searched.filter(e => e.status === "scheduled" || e.status === "live");
  const past = searched.filter(e => e.status === "ended");

  const searchedConnections = search.trim()
    ? connections.filter(c => c.display_name?.toLowerCase().includes(search.toLowerCase()) || c.organisation?.toLowerCase().includes(search.toLowerCase()))
    : connections;

  const archivedCount = events.filter(e => archivedIds.has(e.id)).length;

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(226,109,52,0.06), transparent), var(--base)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <OreetiMark size={30} />
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
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(234,230,223,0.08)" }}>
          {(["events", "connections"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: "10px 4px", marginRight: 24, background: "none", border: "none",
                borderBottom: tab === t ? "2px solid var(--ember)" : "2px solid transparent",
                color: tab === t ? "var(--ivory)" : "var(--ivory-muted)",
                fontSize: 13, fontWeight: 600, letterSpacing: "0.02em", cursor: "pointer",
              }}>
              {t === "events" ? "My Events" : "Connects"}
            </button>
          ))}
          <a href="/home/profile"
            style={{
              padding: "10px 4px", background: "none", border: "none",
              borderBottom: "2px solid transparent",
              color: "var(--ivory-muted)", textDecoration: "none",
              fontSize: 13, fontWeight: 600, letterSpacing: "0.02em", cursor: "pointer",
            }}>
            Profile
          </a>
        </div>

        {/* Search */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === "events" ? "Search your events" : "Search your connects"}
            style={{
              flex: 1, padding: "11px 14px", borderRadius: 12,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--ivory)", fontSize: 13.5, outline: "none", boxSizing: "border-box",
            }}
          />
          {tab === "events" && archivedCount > 0 && (
            <button onClick={() => setShowArchived(s => !s)}
              style={{
                flexShrink: 0, padding: "0 14px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                background: showArchived ? "rgba(226,109,52,0.1)" : "rgba(255,255,255,0.03)",
                border: showArchived ? "1px solid rgba(226,109,52,0.3)" : "1px solid rgba(255,255,255,0.08)",
                color: showArchived ? "var(--ember)" : "var(--ivory-muted)", cursor: "pointer",
              }}>
              {showArchived ? "Hide archived" : `Archived (${archivedCount})`}
            </button>
          )}
        </div>

        {dataLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ height: 84, borderRadius: 14, background: "rgba(255,255,255,0.02)" }} />)}
          </div>
        ) : tab === "events" ? (
          <EventsList upcoming={upcoming} past={past} archivedIds={archivedIds} onToggleArchive={handleToggleArchive} hadAnyMatch={events.length > 0} />
        ) : (
          <ConnectionsList connections={searchedConnections} hadAnyMatch={connections.length > 0} />
        )}
      </div>
    </div>
  );
}

function EventsList({ upcoming, past, archivedIds, onToggleArchive, hadAnyMatch }: {
  upcoming: MyEvent[]; past: MyEvent[]; archivedIds: Set<string>; onToggleArchive: (id: string) => void; hadAnyMatch: boolean;
}) {
  if (upcoming.length === 0 && past.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <p style={{ color: "var(--dusk)", fontSize: 13.5, marginBottom: 16 }}>
          {hadAnyMatch ? "No events match." : "You haven't attended or hosted an event yet."}
        </p>
        {!hadAnyMatch && <a href="/events" style={{ color: "var(--ember)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Find something happening →</a>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {upcoming.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(138,115,85,0.6)", margin: "0 0 12px" }}>Upcoming</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.map(e => <EventRow key={e.id} event={e} isArchived={archivedIds.has(e.id)} onToggleArchive={onToggleArchive} />)}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(138,115,85,0.6)", margin: "0 0 12px" }}>Past</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {past.map(e => <EventRow key={e.id} event={e} isArchived={archivedIds.has(e.id)} onToggleArchive={onToggleArchive} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function EventRow({ event, isArchived, onToggleArchive }: { event: MyEvent; isArchived: boolean; onToggleArchive: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
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
    <div style={{ position: "relative", opacity: isArchived ? 0.55 : 1 }}>
      <a href={href} style={{
        display: "flex", alignItems: "center", gap: 14, padding: "14px 44px 14px 16px", borderRadius: 14,
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

      {/* Archive/unarchive — per-viewer only, doesn't touch the event
          itself or anyone else's view of it. */}
      <button
        onClick={e => { e.stopPropagation(); e.preventDefault(); setMenuOpen(o => !o); }}
        style={{
          position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: 8,
          background: "rgba(255,255,255,0.04)", border: "none", color: "var(--ivory-muted)",
          fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        ⋯
      </button>
      {menuOpen && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ position: "absolute", top: 40, right: 10, background: "#141416", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden", zIndex: 10 }}
        >
          <button
            onClick={() => { onToggleArchive(event.id); setMenuOpen(false); }}
            style={{ display: "block", width: "100%", padding: "9px 16px", background: "none", border: "none", color: "var(--ivory)", fontSize: 12.5, textAlign: "left", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            {isArchived ? "Unarchive" : "Archive from my list"}
          </button>
        </div>
      )}
    </div>
  );
}

function ConnectionsList({ connections, hadAnyMatch }: { connections: MyConnection[]; hadAnyMatch: boolean }) {
  if (connections.length === 0) {
    return (
      <p style={{ color: "var(--dusk)", fontSize: 13.5, textAlign: "center", padding: "60px 0" }}>
        {hadAnyMatch ? "No connects match." : "No connects yet — they'll show up here once you meet people at an event, connect via your Oreeti card, or someone scans your card and sends their details back."}
      </p>
    );
  }

  const shared = connections.filter(c => c.source === "shared");
  const mutual = connections.filter(c => c.source !== "shared");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {shared.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", margin: "0 0 12px" }}>
            Shared With You
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {shared.map(c => <SharedRow key={c.id} connection={c} />)}
          </div>
        </div>
      )}
      {mutual.length > 0 && (
        <div>
          {shared.length > 0 && (
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(138,115,85,0.6)", margin: "0 0 12px" }}>
              Connects
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {mutual.map(c => <ConnectionRow key={c.id} connection={c} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectionRow({ connection: c }: { connection: MyConnection }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ivory)", margin: "0 0 2px" }}>{c.display_name}</p>
        {c.source === "card" && (
          <span style={{ fontSize: 8.5, fontWeight: 700, color: "var(--gold)", background: "rgba(212,175,55,0.1)", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.04em" }}>OREETI CARD</span>
        )}
      </div>
      {c.organisation && <p style={{ fontSize: 11.5, color: "var(--dusk)", margin: "0 0 6px" }}>{c.organisation}</p>}
      {c.source === "event" ? (
        <p style={{ fontSize: 11, color: "var(--ember)", margin: 0 }}>
          {c.events_met_at.length === 1
            ? `Met at ${c.events_met_at[0].event_title}`
            : `Met at ${c.events_met_at.length} events`}
        </p>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 11, color: "#22c55e", margin: 0 }}>✓ Connected</p>
          {c.slug && (
            <a href={`/u/${c.slug}`} style={{ fontSize: 11, color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>View card →</a>
          )}
        </div>
      )}
    </div>
  );
}

/** A one-way "shared" entry — this person isn't an Oreeti user (yet), so
 * there's no mutual connection to show, just what they chose to send back.
 * Surfaces the phone directly since that's the whole point of the
 * exchange, plus a nudge that this becomes a real connection if they ever
 * create an account and connect through their own card. */
function SharedRow({ connection: c }: { connection: MyConnection }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ivory)", margin: 0 }}>{c.display_name}</p>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: "var(--dusk)", background: "rgba(138,115,85,0.12)", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.04em" }}>NOT YET ON OREETI</span>
        </div>
      </div>
      {c.phone && (
        <a href={`https://wa.me/${c.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--ivory-muted)", textDecoration: "none", margin: "4px 0 0", display: "block" }}>
          💬 {c.phone}
        </a>
      )}
      <p style={{ fontSize: 10.5, color: "rgba(240,237,232,0.35)", margin: "6px 0 0" }}>
        Sent their details back after scanning your card — one-way until they create their own.
      </p>
    </div>
  );
}
