"use client";
import { fallbackVisual } from "@/lib/events/fallbackVisual";

export interface DirectoryEvent {
  id: string;
  title: string;
  venue: string;
  description: string;
  start_time: string;
  slug: string;
  status: string;
  banner_url: string | null;
}

// Shared between the public Events directory (/events) and the in-app
// Discover Events list (/home/discover) so both look identical — same
// card size, same fallback visuals, same Register/Enter event logic.
export default function EventCard({
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
        display: "block", width: 200, borderRadius: 16, overflow: "hidden",
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        textDecoration: "none", transition: "border-color 0.15s ease",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: 150, background: event.banner_url ? "#000" : fallback.background, overflow: "hidden" }}>
        {event.banner_url ? (
          <img src={event.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <>
            <div style={{
              position: "absolute", left: `calc(50% - ${fallback.ringOffset}px)`, top: "50%", transform: "translate(-50%,-50%)",
              width: 100, height: 100, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.14)",
            }} />
            <div style={{
              position: "absolute", left: `calc(50% + ${fallback.ringOffset}px)`, top: "50%", transform: "translate(-50%,-50%)",
              width: 65, height: 65, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)",
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
