"use client";
// Level 1 reveal — visible in the room before any connection.
// Shows: first name only · intent pills · industry.
// No org, no role title, no last name, no bio.

import { parseIntents } from "./shared";
import { INTENT_MAP } from "@/lib/matching/intents";

const EMBER = "#E26D34";
const DUSK  = "#8A7355";

interface AttendeeCardProps {
  attendee: any;
  sent: boolean;
  onConnect: () => void;
  live?: boolean;
}

export default function AttendeeCard({ attendee, sent, onConnect, live }: AttendeeCardProps) {
  const intents   = parseIntents(attendee.networking_intents);
  const firstName = attendee.display_name?.trim().split(" ")[0] ?? "Guest";
  const roleId    = attendee.role && attendee.role !== "attendee" ? attendee.role : null;
  const ROLE_ICONS: Record<string, { label: string; color: string; bg: string; border: string; svg: string }> = {
    vip:     { label: "VIP",     color: "#D4AF37", bg: "rgba(212,175,55,0.1)",  border: "rgba(212,175,55,0.25)", svg: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' },
    speaker: { label: "Speaker", color: "#E26D34", bg: "rgba(226,109,52,0.1)",  border: "rgba(226,109,52,0.25)", svg: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>' },
    host:    { label: "Host",    color: "#A78BFA", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)", svg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' },
  };
  const roleChip  = roleId ? ROLE_ICONS[roleId] ?? null : null;

  return (
    <div style={{ background: "#1C1C1E", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* First name only + live dot + role badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
            {live && <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", display: "inline-block", flexShrink: 0 }} />}
            <p style={{ fontSize: "15px", fontWeight: "600", color: "#f1f0f5", margin: 0 }}>{firstName}</p>
            {roleChip && (
              <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", fontSize:"10px", fontWeight:"700", letterSpacing:"0.04em", color: roleChip.color, background: roleChip.bg, border: "1px solid " + roleChip.border, borderRadius:"6px", padding:"2px 7px 2px 5px" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" style={{ flexShrink:0 }} dangerouslySetInnerHTML={{ __html: roleChip.svg }} />
                {roleChip.label}
              </span>
            )}
          </div>

          {/* Industry — visible at Level 1 */}
          {attendee.industry && (
            <p style={{ fontSize: "11px", color: DUSK, margin: "0 0 8px", fontWeight: "500" }}>{attendee.industry}</p>
          )}

          {/* Intent pills — specific sub-category labels */}
          {intents.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {intents.map(id => {
                const intent = INTENT_MAP[id];
                return intent ? (
                  <span key={id} style={{ fontSize: "10px", color: DUSK, background: "rgba(138,115,85,0.1)", border: "1px solid rgba(138,115,85,0.2)", borderRadius: "5px", padding: "2px 7px", fontWeight: "600" }}>
                    {intent.label}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        <button onClick={onConnect} disabled={sent}
          style={{ flexShrink: 0, fontSize: "11px", fontWeight: "600",
            color: sent ? "rgba(255,255,255,0.25)" : EMBER,
            background: sent ? "rgba(255,255,255,0.02)" : "transparent",
            border: sent ? "1px solid rgba(255,255,255,0.06)" : `1px solid rgba(226,109,52,0.3)`,
            borderRadius: "8px", padding: "7px 14px", cursor: sent ? "default" : "pointer",
          }}>
          {sent ? "Sent" : "Connect"}
        </button>
      </div>
    </div>
  );
}
