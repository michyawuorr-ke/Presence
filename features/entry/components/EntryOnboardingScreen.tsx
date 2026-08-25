const EMBER = "#E26D34";
const DUSK  = "#8A7355";

type EntryOnboardingScreenProps = {
  displayName: string;
  setDisplayName: React.Dispatch<React.SetStateAction<string>>;
  role: string;
  setRole: React.Dispatch<React.SetStateAction<string>>;
  organisation: string;
  setOrganisation: React.Dispatch<React.SetStateAction<string>>;
  industry: string;
  setIndustry: React.Dispatch<React.SetStateAction<string>>;
  bio: string;
  setBio: React.Dispatch<React.SetStateAction<string>>;
  masterProfile?: any;
  getPresenceLabel: () => string;
  setIsPresenceOpen: React.Dispatch<React.SetStateAction<boolean>>;
  getIntentLabel: () => string;
  setIsIntentOpen: React.Dispatch<React.SetStateAction<boolean>>;
  stations: any[];
  stationId: string;
  setStationId: React.Dispatch<React.SetStateAction<string>>;
  error: string;
  restoredIdentity?: boolean;
  canSubmit: boolean;
  saving: boolean;
  onSubmit: () => void;
};

const INDUSTRIES = [
  "Technology","Finance & Banking","Healthcare","Education","Agribusiness",
  "Real Estate","Retail & E-commerce","Media & Creative","Arts & Entertainment","Energy",
  "Community & Culture","NGO & Social Impact","Government & Policy","Legal","Consulting",
  "Manufacturing","Logistics & Supply Chain","Other",
];

export default function EntryOnboardingScreen({
  displayName, setDisplayName,
  role, setRole,
  organisation, setOrganisation,
  industry, setIndustry,
  bio, setBio,
  masterProfile,
  getPresenceLabel, setIsPresenceOpen,
  getIntentLabel, setIsIntentOpen,
  stations, stationId, setStationId,
  error, restoredIdentity, canSubmit, saving, onSubmit,
}: EntryOnboardingScreenProps) {

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 0", background: "transparent", border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#FDFBF7",
    fontSize: "14px", outline: "none", borderRadius: 0,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#FDFBF7", padding: "0 24px", display: "flex", flexDirection: "column", alignItems: "center", boxSizing: "border-box", overflowX: "hidden" }}>

      <header style={{ width: "100%", maxWidth: "480px", paddingTop: "48px", textAlign: "center" }}>
        <p style={{ fontSize: "19px", fontWeight: "700", letterSpacing: "-0.03em", fontFamily: "'Helvetica Neue',Arial,sans-serif", margin: 0 }}><span style={{ color: "#ffffff" }}>Or</span><span style={{ color: "#E26D34" }}>ee</span><span style={{ color: "#ffffff" }}>ti</span></p>
      </header>

      <main style={{ width: "100%", maxWidth: "480px", flex: 1, paddingTop: "24px", paddingBottom: "144px", overflowY: "auto" }}>

        {/* Welcome back pill */}
        {restoredIdentity && masterProfile && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <div style={{ background: "linear-gradient(135deg, rgba(226,109,52,0.10), rgba(226,109,52,0.04))", border: "1px solid rgba(226,109,52,0.22)", borderRadius: "999px", padding: "10px 20px", display: "inline-flex", alignItems: "center", gap: "10px", boxShadow: "0 0 24px rgba(226,109,52,0.08)" }}>
              <span style={{ fontSize: "16px" }}>✦</span>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: EMBER, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>Welcome back</p>
                <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)", marginTop: "1px" }}>{masterProfile.display_name} · your details are prefilled</p>
              </div>
            </div>
          </div>
        )}

        {/* About You */}
        <section style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "20px", borderRadius: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: DUSK, textTransform: "uppercase", margin: "0 0 16px" }}>About You</p>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your Name" style={inp} autoComplete="off" />
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Role or Title" style={{ ...inp, marginTop: "4px" }} autoComplete="off" />
          <input value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Organisation / Studio" style={{ ...inp, marginTop: "4px" }} autoComplete="off" />
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short Bio (optional)" rows={2} style={{ ...inp, marginTop: "4px", resize: "none", height: "54px" }} autoComplete="off" />
        </section>

        {/* Industry */}
        <section style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: DUSK, textTransform: "uppercase", display: "block", marginBottom: "10px" }}>Industry</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {INDUSTRIES.map(ind => {
              const sel = industry === ind;
              return (
                <button key={ind} onClick={() => setIndustry(sel ? "" : ind)}
                  style={{ padding: "7px 14px", borderRadius: "20px", border: "1px solid", fontSize: "12px", fontWeight: sel ? "600" : "400", cursor: "pointer",
                    background: sel ? "rgba(226,109,52,0.1)" : "rgba(255,255,255,0.02)",
                    borderColor: sel ? "rgba(226,109,52,0.4)" : "rgba(255,255,255,0.06)",
                    color: sel ? EMBER : "rgba(255,255,255,0.5)",
                  }}>
                  {ind}
                </button>
              );
            })}
          </div>
        </section>

        {/* Professional Presence */}
        <section style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: DUSK, textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Professional Presence</label>
          <button onClick={() => setIsPresenceOpen(true)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "10px", cursor: "pointer", color: "#FDFBF7" }}>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{getPresenceLabel()}</span>
            <span style={{ fontSize: "10px", letterSpacing: "0.15em", color: DUSK }}>MANAGE</span>
          </button>
        </section>

        {/* What Brings You Here */}
        <section style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: DUSK, textTransform: "uppercase", display: "block", marginBottom: "8px" }}>What Brings You Here?</label>
          <button onClick={() => setIsIntentOpen(true)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "10px", cursor: "pointer", color: "#FDFBF7" }}>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{getIntentLabel()}</span>
            <span style={{ fontSize: "10px", letterSpacing: "0.15em", color: DUSK }}>SELECT</span>
          </button>
        </section>

        {/* Networking Station */}
        {stations.length > 0 && (
          <section style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", color: DUSK, textTransform: "uppercase", display: "block", marginBottom: "10px" }}>Networking Station</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {stations.map(station => {
                const sel = stationId === station.id;
                return (
                  <button key={station.id} onClick={() => setStationId(station.id)}
                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", textAlign: "left", borderRadius: "10px", border: "1px solid", cursor: "pointer",
                      background: sel ? "rgba(226,109,52,0.04)" : "rgba(255,255,255,0.01)",
                      borderColor: sel ? EMBER : "rgba(255,255,255,0.05)",
                    }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0, border: sel ? `2px solid ${EMBER}` : "2px solid rgba(255,255,255,0.2)", background: sel ? EMBER : "transparent" }} />
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: "500", color: sel ? "#fff" : "rgba(255,255,255,0.7)", margin: 0 }}>{station.name}</p>
                      {station.subtitle && <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>{station.subtitle}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {error && <p style={{ fontSize: "12px", color: EMBER, textAlign: "center", marginTop: "8px", fontFamily: "monospace" }}>{error}</p>}
      </main>

      <footer style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(10,10,10,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.04)", padding: "16px 24px", paddingBottom: "calc(16px + env(safe-area-inset-bottom))", zIndex: 40 }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <button disabled={!canSubmit} onClick={onSubmit}
            style={{ width: "100%", height: "46px", fontFamily: "monospace", fontSize: "12px", letterSpacing: "0.22em", fontWeight: "700", borderRadius: "8px", transition: "all 0.3s",
              background: canSubmit ? "#fff" : "rgba(255,255,255,0.02)",
              border: canSubmit ? `1px solid ${EMBER}` : "1px solid rgba(255,255,255,0.05)",
              color: canSubmit ? "#000" : "rgba(255,255,255,0.15)",
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}>
            {saving ? "SAVING..." : "COMPLETE PROFILE"}
          </button>
        </div>
      </footer>
    </div>
  );
}
