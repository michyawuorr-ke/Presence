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
  const badge     = attendee.role && attendee.role !== "attendee" ? attendee.role_badge : null;

  return (
    <div style={{ background: "#1C1C1E", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* First name only + live dot + role badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
            {live && <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", display: "inline-block", flexShrink: 0 }} />}
            <p style={{ fontSize: "15px", fontWeight: "600", color: "#f1f0f5", margin: 0 }}>{firstName}</p>
            {badge && <span style={{ fontSize: "12px" }}>{badge}</span>}
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
