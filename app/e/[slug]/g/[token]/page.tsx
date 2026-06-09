"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface Station {
  id: string;
  name: string;
  context: string;
}

export default function GuestOnboardingPage() {
  const params = useParams();
  const router = useRouter();
  
  const slug = params?.slug as string;
  const token = params?.token as string;

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Step 1: Core Clean Identity
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [bio, setBio] = useState("");

  // Step 2: Presence Bottom Sheet Matrices
  const [isPresenceOpen, setIsPresenceOpen] = useState(false);
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [portfolio, setPortfolio] = useState("");

  // Step 4: Intent Bottom Sheet Matrices
  const [isIntentOpen, setIsIntentOpen] = useState(false);
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);

  // Step 3: Host Dashboard Dynamic Stations (CRITICAL FIX)
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState("");

  // Fetch Host Dashboard Configurations dynamically based on the active event slug
  useEffect(() => {
    async function pullHostVenueConfig() {
      if (!slug) return;
      try {
        const { data: eventData } = await supabase
          .from("events")
          .select("id")
          .eq("slug", slug)
          .single();

        if (eventData) {
          setEventId(eventData.id);

          // CRITICAL FIX: Pull directly from the active host venue's station list
          const { data: stationData } = await supabase
            .from("event_stations")
            .select("id, name, context")
            .eq("event_id", eventData.id);

          if (stationData) {
            setStations(stationData);
          }
        }
      } catch (err) {
        console.error("Critical error mapping event perimeter rules:", err);
      } finally {
        setLoadingConfig(false);
      }
    }
    pullHostVenueConfig();
  }, [slug]);

  // Presence Status String Composer
  const getPresenceLabel = () => {
    const added = [];
    if (linkedin.trim()) added.push("LinkedIn");
    if (website.trim()) added.push("Website");
    if (portfolio.trim()) added.push("Portfolio");
    
    if (added.length === 0) return "Select Presence Links";
    if (added.length === 1) return `✓ ${added[0]} Added`;
    return `✓ ${added.length} Professional Links Added`;
  };

  // Intent Selection Handler
  const toggleIntent = (id: string) => {
    setSelectedIntents(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getIntentLabel = () => {
    if (selectedIntents.length === 0) return "Select Intent";
    if (selectedIntents.length === 1) return `✓ ${selectedIntents[0]} Selected`;
    return `✓ ${selectedIntents.join(" + ")} Selected`;
  };

  // STRICT VALIDATION ENGINE
  const isIdentityValid = displayName.trim() !== "" && role.trim() !== "";
  const isPresenceValid = linkedin.trim() !== "" || website.trim() !== "" || portfolio.trim() !== "";
  const isIntentValid = selectedIntents.length > 0;
  const isStationValid = selectedStationId !== "";
  
  const canSubmit = isIdentityValid && isPresenceValid && isIntentValid && isStationValid && !saving;

  const handleManifestation = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError("");

    try {
      const { error: err } = await supabase.from("guest_profiles").insert({
        registration_id: token,            
        event_id: eventId,
        display_name: displayName,                   
        role_title: role,
        organisation,
        bio,
        platform_type: "link",
        platform_value: linkedin.trim() || website.trim() || portfolio.trim() || "",                        
        aura_active: false,
        networking_intents: selectedIntents,
        target_station_id: selectedStationId,
        linkedin_url: linkedin,
        website_url: website,
        portfolio_url: portfolio
      });

      if (err) throw err;

      router.push(`/e/${slug}/scene`);
    } catch (err: any) {
      setError(err.message || "Failed to manifest identity.");
      setSaving(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-4 h-4 border-t-2 border-[#F97316] rounded-full animate-spin" />
      </div>
    );
  }

  const inpStyle = {
    width: "100%", padding: "14px 0", background: "transparent", border: "none",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)", color: "#FDFBF7",
    fontSize: "15px", outline: "none", borderRadius: 0, marginBottom: "16px"
  };

  const triggerBtnStyle = (hasValue: boolean) => ({
    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: "3px", color: hasValue ? "#F97316" : "rgba(255,255,255,0.4)",
    fontSize: "14px", cursor: "pointer", marginBottom: "20px", textAlign: "left" as const
  });

  const cardStyle = (isActive: boolean) => ({
    width: "100%", textAlign: "left" as const, padding: "18px",
    background: "rgba(255,255,255,0.01)",
    border: isActive ? "1px solid rgba(249, 115, 22, 0.25)" : "1px solid rgba(255,255,255,0.03)",
    backgroundColor: isActive ? "rgba(249, 115, 22, 0.02)" : "transparent",
    borderRadius: "3px", marginBottom: "12px", cursor: "pointer", outline: "none"
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FDFBF7] px-6 flex flex-col items-center justify-between box-border relative overflow-x-hidden">
      
      <header className="w-full pt-14 max-w-md mx-auto text-center">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-[#F97316] m-0 uppercase">OREETI</p>
      </header>

      <main className="w-full max-w-md mx-auto flex-1 pt-8 pb-36 overflow-y-auto">
        
        {/* STEP 1: ABOUT YOU */}
        <section className="mb-8">
          <h1 className="text-2xl font-light tracking-tight text-[#FDFBF7] mb-1">Manifest Identity</h1>
          <p className="text-sm text-white/35 mb-6">Who are you entering the room as?</p>
          
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" style={inpStyle} autoComplete="off" />
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Your role or title" style={inpStyle} autoComplete="off" />
          <input value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Organisation / Studio" style={inpStyle} autoComplete="off" />
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short Bio" rows={2} style={{ ...inpStyle, height: "64px", resize: "none" }} autoComplete="off" />
        </section>

        {/* STEP 2: PROFESSIONAL PRESENCE DISCLOSURE */}
        <section className="mb-6">
          <label className="block text-[10px] font-mono tracking-wider text-white/30 uppercase mb-3">Professional Presence</label>
          <button onClick={() => setIsPresenceOpen(true)} style={triggerBtnStyle(isPresenceValid)}>
            <span>{getPresenceLabel()}</span>
            <span className="text-white/20 text-xs">➔</span>
          </button>
        </section>

        {/* STEP 4: NETWORKING INTENT DISCLOSURE */}
        <section className="mb-8">
          <label className="block text-[10px] font-mono tracking-wider text-white/30 uppercase mb-3">What brings you to this event?</label>
          <button onClick={() => setIsIntentOpen(true)} style={triggerBtnStyle(isIntentValid)}>
            <span>{getIntentLabel()}</span>
            <span className="text-white/20 text-xs">➔</span>
          </button>
        </section>

        {/* STEP 3: DYNAMIC HOST DASHBOARD STATIONS */}
        <section className="mb-8">
          <label className="block text-[10px] font-mono tracking-wider text-white/30 uppercase mb-3">Target Proximity</label>
          <p className="text-xs text-white/40 mb-4">Select the host environment containing the minds you need to be around.</p>
          
          {stations.length === 0 ? (
            <p className="text-sm text-white/20 italic">No custom host environments deployed yet.</p>
          ) : (
            stations.map((station) => (
              <button type="button" key={station.id} onClick={() => setSelectedStationId(station.id)} style={cardStyle(selectedStationId === station.id)}>
                <h4 style={{ fontSize: "14px", fontWeight: 500, margin: 0, color: selectedStationId === station.id ? "#F97316" : "#FDFBF7" }}>
                  {station.name}
                </h4>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", margin: "4px 0 0 0", lineHeight: "16px" }}>
                  {station.context}
                </p>
              </button>
            ))
          )}
        </section>

        {error && <p className="text-xs text-[#F97316] text-center mt-4">{error}</p>}
      </main>

      {/* ERGONOMIC BOTTOM BAR */}
      <footer className="fixed bottom-0 left-0 right-0 h-28 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-white/[0.02] px-6 flex items-center z-40">
        <div className="w-full max-w-md mx-auto">
          <button 
            disabled={!canSubmit} 
            onClick={handleManifestation}
            className="w-full h-12 font-mono text-xs tracking-[0.2em] font-semibold rounded-sm transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.01)",
              border: canSubmit ? "1px solid rgba(249, 115, 22, 0.4)" : "1px solid rgba(255,255,255,0.06)",
              color: canSubmit ? "#F97316" : "rgba(255,255,255,0.15)",
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: canSubmit ? 1 : 0.4
            }}
          >
            {saving ? "MANIFESTING ID···" : "ENTER INDUCTION"}
          </button>
        </div>
      </footer>

      {/* BOTTOM SHEET: PRESENCE LINKS */}
      {isPresenceOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col justify-end" onClick={() => setIsPresenceOpen(false)}>
          <div className="w-full bg-[#0E0E0E] border-t border-white/[0.05] rounded-t-xl p-6 max-w-md mx-auto space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium tracking-tight text-white/70">Professional Presence</h3>
              <button onClick={() => setIsPresenceOpen(false)} className="text-[10px] font-mono text-white/30 hover:text-white tracking-widest">CLOSE</button>
            </div>
            <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="LinkedIn URL" style={inpStyle} autoComplete="off" />
            <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website URL" style={inpStyle} autoComplete="off" />
            <input value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="Portfolio URL" style={inpStyle} autoComplete="off" />
            <button onClick={() => setIsPresenceOpen(false)} className="w-full h-11 bg-white/5 border border-white/10 rounded-sm font-mono text-[11px] tracking-widest text-[#FDFBF7] mt-2">
              SAVE PRESENCE
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET: NETWORKING INTENT */}
      {isIntentOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col justify-end" onClick={() => setIsIntentOpen(false)}>
          <div className="w-full bg-[#0E0E0E] border-t border-white/[0.05] rounded-t-xl p-6 max-w-md mx-auto space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium tracking-tight text-white/70">What brings you to this event?</h3>
              <button onClick={() => setIsIntentOpen(false)} className="text-[10px] font-mono text-white/30 hover:text-white tracking-widest">CLOSE</button>
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {[
                { id: "Capital", label: "Capital", desc: "Fundraising, investors, and strategic ideas." },
                { id: "Synergy", label: "Synergy", desc: "Collaborators, co-founders, and deep execution partnerships." },
                { id: "Mentorship", label: "Mentorship", desc: "Actively seeking guidance or looking to offer perspective." },
                { id: "Opportunities", label: "Opportunities", desc: "Career growth, partnerships, and introductions." }
              ].map((item) => {
                const isActive = selectedIntents.includes(item.id);
                return (
                  <button type="button" key={item.id} onClick={() => toggleIntent(item.id)} style={cardStyle(isActive)}>
                    <h4 style={{ fontSize: "14px", fontWeight: 500, margin: 0, color: isActive ? "#F97316" : "#FDFBF7" }}>
                      {item.label}
                    </h4>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", margin: "4px 0 0 0", lineHeight: "15px" }}>
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setIsIntentOpen(false)} className="w-full h-11 bg-white/5 border border-white/10 rounded-sm font-mono text-[11px] tracking-widest text-[#FDFBF7] mt-2">
              CONFIRM INTENT
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
