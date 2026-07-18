"use client";
// Shown after a QR scan unlock. Lets the person whose profile was
// unlocked choose exactly what the scanner can see — per-connection.
// Different people can see different things.

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

const EMBER = "#E26D34";
const DUSK  = "#8A7355";

interface DisclosureOption {
  key: "show_linkedin" | "show_website" | "show_portfolio" | "show_phone";
  label: string;
  icon: string;
  value: string | null | undefined;
}

interface Props {
  unlockId: string;      // profile_unlocks.id
  ownerId: string;       // my guest_profile.id
  viewerId: string;      // their guest_profile.id
  viewerName: string;
  myProfile: any;
  onSave: () => void;
  onSkip: () => void;
}

export default function DisclosureSheet({ unlockId, ownerId, viewerId, viewerName, myProfile, onSave, onSkip }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const options: DisclosureOption[] = (([
    { key: "show_linkedin",  label: "LinkedIn",  icon: "💼", value: myProfile?.linkedin_url },
    { key: "show_website",   label: "Website",   icon: "🌐", value: myProfile?.website_url },
    { key: "show_portfolio", label: "Portfolio", icon: "🗂",  value: myProfile?.portfolio_url },
    { key: "show_phone",     label: "Phone",     icon: "📞", value: myProfile?.phone_number },
  ] as DisclosureOption[])).filter(o => o.value?.trim()); // only show options they've actually filled in

  function toggle(key: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    await supabase.from("connection_disclosures").upsert({
      unlock_id:      unlockId,
      owner_id:       ownerId,
      viewer_id:      viewerId,
      show_linkedin:  selected.has("show_linkedin"),
      show_website:   selected.has("show_website"),
      show_portfolio: selected.has("show_portfolio"),
      show_phone:     selected.has("show_phone"),
      updated_at:     new Date().toISOString(),
    }, { onConflict: "unlock_id,owner_id,viewer_id" });
    setSaving(false);
    onSave();
  }

  const first = viewerName.trim().split(" ")[0];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", zIndex: 60 }}>
      <div style={{ background: "#0E0E0E", borderRadius: "24px 24px 0 0", padding: "28px 24px", paddingBottom: "calc(28px + env(safe-area-inset-bottom))", width: "100%", borderTop: "1px solid rgba(255,255,255,0.06)" }}>

        <p style={{ fontSize: "18px", fontWeight: "600", color: "#f0ede8", margin: "0 0 4px" }}>
          Connected with {first}
        </p>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "0 0 24px", lineHeight: "1.5" }}>
          Choose what {first} can see from your profile. You can always update this later.
        </p>

        {options.length === 0 ? (
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", marginBottom: "24px" }}>
            No contact details added to your profile yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
            {options.map(opt => {
              const sel = selected.has(opt.key);
              return (
                <button key={opt.key} onClick={() => toggle(opt.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    padding: "14px 16px", borderRadius: "12px", textAlign: "left", cursor: "pointer",
                    background: sel ? "rgba(226,109,52,0.07)" : "rgba(255,255,255,0.02)",
                    border: sel ? "1px solid rgba(226,109,52,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}>
                  {/* Checkbox */}
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0,
                    border: sel ? `2px solid ${EMBER}` : "2px solid rgba(255,255,255,0.2)",
                    background: sel ? EMBER : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {sel && <span style={{ fontSize: "11px", color: "#fff", fontWeight: "800" }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "14px" }}>{opt.icon}</span>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: sel ? "#f0ede8" : "rgba(255,255,255,0.6)", margin: 0 }}>{opt.label}</p>
                    </div>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {opt.value}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onSkip}
            style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: "13px", cursor: "pointer" }}>
            Skip for now
          </button>
          <button onClick={save} disabled={saving}
            style={{ flex: 2, padding: "12px", borderRadius: "10px", background: EMBER, border: "none", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
            {saving ? "Saving..." : `Share with ${first}`}
          </button>
        </div>
      </div>
    </div>
  );
}
