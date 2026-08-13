"use client";
import { useEffect, useState, useMemo } from "react";
import Wordmark from "@/components/Wordmark";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import HomeProfilePage from "./profile/page";
import {
  loadMyEvents, loadMyConnections, checkIsHost,
  loadArchivedEventIds, archiveEvent, unarchiveEvent,
  type MyEvent, type MyConnection,
} from "./homeData";

type Tab = "events" | "connections" | "profile";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("connections");
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
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 24px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Wordmark />
          <button onClick={handleSignOut} style={{ background: "none", border: "none", color: "var(--ivory-muted)", fontSize: 11.5, letterSpacing: "0.04em", cursor: "pointer" }}>
            Sign Out
          </button>
        </div>

        {isHost && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 18px", borderRadius: 14, marginBottom: 20,
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

        {/* Tabs — Profile is a real tab now, not a link to a separate
            route, so switching to it behaves exactly like Events/Connects
            (instant, no page load) and Sign Out above stays visible on
            every tab instead of disappearing once you're "inside" Profile. */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(234,230,223,0.08)" }}>
          {(["events", "connections", "profile"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: "10px 4px", marginRight: 24, background: "none", border: "none",
                borderBottom: tab === t ? "2px solid var(--ember)" : "2px solid transparent",
                color: tab === t ? "var(--ivory)" : "var(--ivory-muted)",
                fontSize: 13, fontWeight: 600, letterSpacing: "0.02em", cursor: "pointer",
              }}>
              {t === "events" ? "My Events" : t === "connections" ? "Connects" : "Profile"}
            </button>
          ))}
        </div>

        {/* Discover pill — always visible below tabs, only on events tab */}
        {tab === "events" && (
          <a href="/home/discover" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "9px 16px", marginBottom: 16, borderRadius: 10,
            background: "rgba(226,109,52,0.07)", border: "1px solid rgba(226,109,52,0.18)",
            textDecoration: "none",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ember)", flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ember)", letterSpacing: "0.02em" }}>Discover events happening on Oreeti</span>
            <span style={{ fontSize: 12, color: "var(--ember)", opacity: 0.6 }}>→</span>
          </a>
        )}

        {/* Search — only relevant to Events/Connects, not the Profile tab */}
        {tab !== "profile" && (
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
        )}

        {tab === "profile" ? (
          <HomeProfilePage embedded />
        ) : dataLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <style>{`@keyframes skeletonShimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}`}</style>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                height: 84, borderRadius: 14,
                background: "linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 37%, rgba(255,255,255,0.02) 63%)",
                backgroundSize: "400% 100%",
                animation: "skeletonShimmer 1.6s ease-in-out infinite",
              }} />
            ))}
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

  // "Happening now" pulled out of upcoming rather than requiring a
  // separate query — status is already loaded on every MyEvent, and
  // 'live' is the exact value the go-live API route sets.
  const live = upcoming.filter(e => e.status === "live");
  const notLive = upcoming.filter(e => e.status !== "live");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {live.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#22c55e", margin: "0 0 12px" }}>Happening now</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {live.map(e => <EventRow key={e.id} event={e} isArchived={archivedIds.has(e.id)} onToggleArchive={onToggleArchive} />)}
          </div>
        </div>
      )}
      {notLive.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(138,115,85,0.6)", margin: "0 0 12px" }}>Upcoming</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notLive.map(e => <EventRow key={e.id} event={e} isArchived={archivedIds.has(e.id)} onToggleArchive={onToggleArchive} />)}
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

// Same brand glyphs used on the profile card and public /u/[slug] page —
// reused here rather than redrawn, so a phone/WhatsApp icon looks the same
// wherever it appears in the app.
function PhoneGlyph() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity={0.75}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>);
}
function WhatsAppGlyph() {
  return (<svg width="14" height="14" viewBox="0 0 32 32" fill="#25D366"><path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.737 5.49 2.027 7.8L0 32l8.418-2.004A15.95 15.95 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.093 22.188c-.337.944-1.67 1.728-2.337 1.838-.6.1-1.362.142-2.194-.138-.506-.17-1.155-.395-1.986-.773-3.488-1.506-5.768-5.012-5.944-5.244-.173-.232-1.41-1.874-1.41-3.574s.893-2.538 1.21-2.882c.317-.344.692-.43.923-.43l.663.012c.213.01.498-.081.779.594.29.694 1.006 2.432 1.093 2.607.087.175.144.379.028.614-.116.234-.173.38-.346.585-.173.206-.364.46-.52.618-.173.173-.353.362-.152.71.202.347.896 1.478 1.922 2.393 1.32 1.177 2.433 1.54 2.78 1.713.347.173.549.144.75-.087.202-.23.866-1.012 1.097-1.36.231-.346.462-.289.779-.173.317.116 2.01.948 2.356 1.12.347.173.578.26.664.404.087.144.087.838-.25 1.782z"/></svg>);
}

function ConnectionsList({ connections, hadAnyMatch }: { connections: MyConnection[]; hadAnyMatch: boolean }) {
  if (connections.length === 0) {
    if (hadAnyMatch) {
      return <p style={{ color: "var(--dusk)", fontSize: 13.5, textAlign: "center", padding: "60px 0" }}>No connects match.</p>;
    }
    // Empty state — no connections at all
    return (
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(226,109,52,0.08)", border: "1px solid rgba(226,109,52,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ember)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ivory)", margin: "0 0 8px", letterSpacing: "-0.01em" }}>Your network starts here</p>
        <p style={{ fontSize: 13, color: "var(--dusk)", lineHeight: 1.6, margin: "0 0 28px" }}>Share your Oreeti card with anyone — in meetings, at events, anywhere. Your connects show up here.</p>
        <a href="/home/profile" style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px",
          borderRadius: 12, background: "rgba(226,109,52,0.1)", border: "1px solid rgba(226,109,52,0.3)",
          color: "var(--ember)", fontSize: 13, fontWeight: 600, textDecoration: "none",
        }}>
          Share your card →
        </a>
      </div>
    );
  }

  // Few connects (1–5) — show list + subtle card nudge at top
  const showCardNudge = connections.filter(c => c.source !== "shared").length <= 5;

  const shared = connections.filter(c => c.source === "shared");

  const cardNudge = showCardNudge ? (
    <a href="/home/profile" style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 8,
      borderRadius: 12, background: "rgba(226,109,52,0.06)", border: "1px solid rgba(226,109,52,0.15)",
      textDecoration: "none",
    }}>
      <span style={{ fontSize: 18 }}>🪪</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "var(--ember)" }}>Share your card</p>
        <p style={{ margin: 0, fontSize: 11.5, color: "var(--dusk)" }}>Works anywhere — not just at events</p>
      </div>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.3} style={{ flexShrink: 0, color: "var(--ivory)" }}><path d="M9 18l6-6-6-6"/></svg>
    </a>
  ) : null;
  const mutual = connections.filter(c => c.source !== "shared");

  // Group mutual connections by the first event they were met at.
  // A connection met at multiple events only groups under the first —
  // showing it in every matching event group would mean the same person
  // appearing several times in one list, which reads as more confusing
  // than helpful. "card" connections and anyone with no event tie land
  // in "Other connections" instead of being left out.
  const eventGroups = new Map<string, MyConnection[]>();
  const otherConnections: MyConnection[] = [];
  mutual.forEach(c => {
    const firstEvent = c.events_met_at[0];
    if (firstEvent) {
      const list = eventGroups.get(firstEvent.event_title) || [];
      list.push(c);
      eventGroups.set(firstEvent.event_title, list);
    } else {
      otherConnections.push(c);
    }
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {cardNudge}
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
      {Array.from(eventGroups.entries()).map(([eventTitle, group]) => (
        <div key={eventTitle}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(138,115,85,0.6)", margin: "0 0 12px" }}>
            {eventTitle}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {group.map(c => <ConnectionRow key={c.id} connection={c} />)}
          </div>
        </div>
      ))}
      {otherConnections.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(138,115,85,0.6)", margin: "0 0 12px" }}>
            Other connections
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {otherConnections.map(c => <ConnectionRow key={c.id} connection={c} />)}
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
        c.events_met_at.length > 1 && (
          <p style={{ fontSize: 11, color: "var(--ember)", margin: 0 }}>
            +{c.events_met_at.length - 1} other event{c.events_met_at.length > 2 ? "s" : ""}
          </p>
        )
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
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <a href={`tel:${c.phone}`} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 9,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            color: "var(--ivory-muted)", textDecoration: "none", fontSize: 12,
          }}>
            <PhoneGlyph /> {c.phone}
          </a>
          <a href={`https://wa.me/${c.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" aria-label="Message on WhatsApp" style={{
            display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 9,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <WhatsAppGlyph />
          </a>
        </div>
      )}
      <p style={{ fontSize: 10.5, color: "rgba(240,237,232,0.35)", margin: "6px 0 0" }}>
        Sent their details back after scanning your card — one-way until they create their own.
      </p>
    </div>
  );
}
