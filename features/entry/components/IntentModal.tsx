"use client";
import { INTENTS_BY_GROUP, INTENT_GROUPS, INTENT_MAP } from "@/lib/matching/intents";

const EMBER = "#E26D34";
const DUSK  = "#8A7355";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  intents: string[];
  toggleIntent: (id: string) => void;
}

export default function IntentModal({ isOpen, onClose, intents, toggleIntent }: Props) {
  if (!isOpen) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#0E0E0E", borderRadius: "24px 24px 0 0", padding: "24px", paddingBottom: "calc(24px + env(safe-area-inset-bottom))", maxHeight: "80vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <p style={{ fontSize: "14px", fontWeight: "600", color: "#fff", margin: 0 }}>What brings you here?</p>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#555", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>Pick the ones that apply — you can select across categories.</p>

        {INTENT_GROUPS.map(group => (
          <div key={group} style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.18em", color: DUSK, textTransform: "uppercase", margin: "0 0 10px" }}>{group}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(INTENTS_BY_GROUP[group] || []).map(intent => {
                const selected = intents.includes(intent.id);
                return (
                  <button
                    key={intent.id}
                    onClick={() => toggleIntent(intent.id)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "12px",
                      padding: "12px 14px", borderRadius: "10px", textAlign: "left", cursor: "pointer",
                      background: selected ? "rgba(226,109,52,0.08)" : "rgba(255,255,255,0.02)",
                      border: selected ? "1px solid rgba(226,109,52,0.35)" : "1px solid rgba(255,255,255,0.05)",
                      transition: "all 0.2s",
                    }}
                  >
                    {/* Radio indicator */}
                    <div style={{
                      width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0, marginTop: "2px",
                      border: selected ? `2px solid ${EMBER}` : "2px solid rgba(255,255,255,0.2)",
                      background: selected ? EMBER : "transparent",
                      transition: "all 0.2s",
                    }} />
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: selected ? "#fff" : "rgba(255,255,255,0.7)", margin: "0 0 2px" }}>
                        {intent.label}
                      </p>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: "1.4" }}>
                        {intent.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {intents.length > 0 && (
          <div style={{ marginTop: "4px", padding: "12px 14px", background: "rgba(226,109,52,0.04)", border: "1px solid rgba(226,109,52,0.1)", borderRadius: "10px" }}>
            <p style={{ fontSize: "10px", color: EMBER, fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px" }}>Selected</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {intents.map(id => (
                <span key={id} style={{ fontSize: "11px", color: EMBER, background: "rgba(226,109,52,0.1)", border: "1px solid rgba(226,109,52,0.25)", borderRadius: "6px", padding: "3px 9px", fontWeight: "600" }}>
                  {INTENT_MAP[id]?.label ?? id}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{ width: "100%", marginTop: "16px", padding: "12px", borderRadius: "10px", background: EMBER, border: "none", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.06em" }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
