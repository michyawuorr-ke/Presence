"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import SceneView from "./SceneView";

interface Station {
  id: string;
  name: string;
  subtitle: string;
}

type Stage = "loading" | "not_found" | "onboarding" | "scene";

export default function GuestEntryPage() {
  const { token } = useParams() as { token: string };

  const [stage, setStage] = useState<Stage>("loading");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [registration, setRegistration] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stations, setStations] = useState<Station[]>([]);

  // Onboarding form fields
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [bio, setBio] = useState("");
  const [presence, setPresence] = useState({ linkedin: "", website: "", portfolio: "" });
  const [isPresenceOpen, setIsPresenceOpen] = useState(false);
  const [intents, setIntents] = useState<string[]>([]);
  const [isIntentOpen, setIsIntentOpen] = useState(false);
  const [stationId, setStationId] = useState("");

  // Resolve token -> registration -> event -> existing profile (gates onboarding vs scene)
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      const { data: reg, error: regErr } = await supabase
        .from("registrations")
        .select("*")
        .eq("access_token", token)
        .single();

      if (regErr || !reg) {
        if (!cancelled) setStage("not_found");
        return;
      }
      if (cancelled) return;
      setRegistration(reg);

      const { data: ev } = await supabase
        .from("events")
        .select("*")
        .eq("id", reg.event_id)
        .single();
      if (cancelled) return;
      setEvent(ev || null);

      if (ev) {
        const { data: st } = await supabase
          .from("event_stations")
          .select("id, name, subtitle")
          .eq("event_id", ev.id);
        if (!cancelled && st) setStations(st);
      }

      const { data: existingProfile } = await supabase
        .from("guest_profiles")
        .select("*")
        .eq("registration_id", reg.id)
        .single();

      if (cancelled) return;

      if (existingProfile) {
        setProfile(existingProfile);
        setStage("scene");
        return;
      }

      // Hosts get an auto-generated profile from their host_profiles record
      // instead of filling out the attendee onboarding form.
      if (reg.status === "host") {
        const hostProfile = await bootstrapHostProfile(reg);
        if (cancelled) return;
        if (hostProfile) {
          setProfile(hostProfile);
          setStage("scene");
          return;
        }
        // If host bootstrap genuinely fails, fall back to the normal onboarding
        // form rather than leaving the host stuck on a blank screen.
      }

      setStage("onboarding");
    }

    load();
    return () => { cancelled = true; };
  }, [token]);

  async function bootstrapHostProfile(reg: any) {
    const { data: evFull } = await supabase
      .from("events")
      .select("host_id")
      .eq("id", reg.event_id)
      .single();
    if (!evFull?.host_id) return null;

    const { data: host } = await supabase
      .from("hosts")
      .select("*")
      .eq("id", evFull.host_id)
      .single();
    if (!host) return null;

    const { data: hostProfile } = await supabase
      .from("host_profiles")
      .select("*")
      .eq("host_id", host.id)
      .single();

    const payload = {
      registration_id: reg.id,
      event_id: reg.event_id,
      display_name: hostProfile?.display_name || host.name || "Host",
      role_title: hostProfile?.role_title || "",
      organisation: hostProfile?.organisation || "",
      bio: hostProfile?.bio || "",
      platform_type: "link",
      platform_value: hostProfile?.platform_value || "",
      aura_active: false,
    };

    // Insert first; if it fails (e.g. a race with another tab/request already
    // creating it), fetch the existing row instead of erroring out.
    const { data: created, error: insertErr } = await supabase
      .from("guest_profiles")
      .insert(payload)
      .select()
      .single();

    if (created) return created;

    if (insertErr) {
      const { data: existing } = await supabase
        .from("guest_profiles")
        .select("*")
        .eq("registration_id", reg.id)
        .single();
      return existing || null;
    }

    return null;
  }

  const getPresenceLabel = () => {
    const added = [];
    if (presence.linkedin.trim()) added.push("LinkedIn");
    if (presence.website.trim()) added.push("Website");
    if (presence.portfolio.trim()) added.push("Portfolio");
    return added.length === 0 ? "Add Professional Links" : `${added.join(" • ")} Linked`;
  };

  const getIntentLabel = () => (intents.length === 0 ? "Select Intent" : intents.join(" + "));

  const toggleIntent = (id: string) => {
    setIntents(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const isIdentityValid = displayName.trim() !== "" && role.trim() !== "";
  const isPresenceValid =
    presence.linkedin.trim() !== "" || presence.website.trim() !== "" || presence.portfolio.trim() !== "";
  const isIntentValid = intents.length > 0;
  const isStationValid = stationId !== "";
  const canSubmit = isIdentityValid && isPresenceValid && isIntentValid && isStationValid && !saving;

  async function handleFinalSubmission() {
    if (!canSubmit || !registration || !event) return;
    setSaving(true);
    setError("");
    try {
      const { data, error: err } = await supabase
        .from("guest_profiles")
        .insert({
          registration_id: registration.id,
          event_id: event.id,
          display_name: displayName,
          role_title: role,
          organisation,
          bio,
          platform_type: "link",
          platform_value: presence.linkedin.trim() || presence.website.trim() || presence.portfolio.trim() || "",
          aura_active: false,
          networking_intents: intents,
          target_station_id: stationId,
          linkedin_url: presence.linkedin,
          website_url: presence.website,
          portfolio_url: presence.portfolio,
        })
        .select()
        .single();

      if (err) throw err;
      setProfile(data);
      setStage("scene");
    } catch (err: any) {
      setError(err.message || "Failed to complete profile registration.");
    } finally {
      setSaving(false);
    }
  }

  if (stage === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-4 h-4 border-t-2 border-[#F97316] rounded-full animate-spin" />
      </div>
    );
  }

  if (stage === "not_found") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#FDFBF7] flex flex-col items-center justify-center px-6 text-center gap-2">
        <p className="text-sm font-medium text-white/80">This invite link isn't valid</p>
        <p className="text-xs text-white/40">Double-check the link or ask your host to resend it.</p>
      </div>
    );
  }

  if (stage === "scene") {
    return (
      <SceneView
        event={event}
        registration={registration}
        profile={profile}
        onProfileUpdate={setProfile}
      />
    );
  }

  // stage === "onboarding"
  const inpStyle = {
    width: "100%", padding: "10px 0", background: "transparent", border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#FDFBF7",
    fontSize: "14px", outline: "none", borderRadius: 0, transition: "border-color 0.3s",
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FDFBF7] px-6 flex flex-col items-center box-border select-none relative overflow-x-hidden">
      <style>{`
        @keyframes slideUpLine { from { height: 0%; } to { height: 100%; } }
        @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-line { animation: slideUpLine 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-sheet-up { animation: sheetUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .focus-under:focus { border-bottom: 1px solid #F97316 !important; }
      `}</style>

      <header className="w-full pt-12 max-w-md mx-auto text-center">
        <p className="text-[10px] font-bold tracking-[0.3em] text-[#F97316] m-0 uppercase">OREETI</p>
      </header>

      <main className="w-full max-w-md mx-auto flex-1 pt-8 pb-36 overflow-y-auto">
        <section className="mb-6 bg-white/[0.01] border border-white/[0.03] p-5 rounded-md space-y-3">
          <h2 className="text-sm font-medium tracking-tight text-white/80 m-0">About You</h2>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your Name" style={inpStyle} className="focus-under" autoComplete="off" />
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Role or Title" style={inpStyle} className="focus-under" autoComplete="off" />
          <input value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Organisation / Studio" style={inpStyle} className="focus-under" autoComplete="off" />
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short Bio" rows={2} style={{ ...inpStyle, height: "54px", resize: "none" }} className="focus-under" autoComplete="off" />
        </section>

        <section className="mb-6">
          <label className="block text-[10px] font-mono tracking-wider text-white/30 uppercase mb-2">Professional Presence</label>
          <button type="button" onClick={() => setIsPresenceOpen(true)}
            className="w-full flex items-center justify-between p-4 bg-white/[0.01] border border-white/[0.04] rounded-sm text-left transition-all duration-300 hover:border-white/10"
            style={{ color: "#FDFBF7" }}>
            <span className="text-sm font-light tracking-wide">{getPresenceLabel()}</span>
            <span className="text-[10px] font-mono tracking-widest text-white/20">MANAGE</span>
          </button>
        </section>

        <section className="mb-10">
          <label className="block text-[10px] font-mono tracking-wider text-white/30 uppercase mb-2">What Brings You Here?</label>
          <button type="button" onClick={() => setIsIntentOpen(true)}
            className="w-full flex items-center justify-between p-4 bg-white/[0.01] border border-white/[0.04] rounded-sm text-left transition-all duration-300 hover:border-white/10"
            style={{ color: "#FDFBF7" }}>
            <span className="text-sm font-light tracking-wide">{getIntentLabel()}</span>
            <span className="text-[10px] font-mono tracking-widest text-white/20">SELECT</span>
          </button>
        </section>

        <section className="mb-6">
          <label className="block text-[10px] font-mono tracking-wider text-white/30 uppercase mb-3">Networking Station</label>
          <div className="space-y-3">
            {stations.length === 0 ? (
              <div className="p-4 border border-white/5 rounded-sm bg-white/[0.01] text-center">
                <p className="text-xs text-white/30 m-0 italic">No stations configured for this event yet.</p>
              </div>
            ) : stations.map((station) => {
              const isSelected = stationId === station.id;
              return (
                <button type="button" key={station.id} onClick={() => setStationId(station.id)}
                  className="w-full text-left p-4 rounded-sm border flex items-start gap-4 transition-all duration-300 outline-none"
                  style={{ background: isSelected ? "rgba(249,115,22,0.02)" : "rgba(255,255,255,0.01)", borderColor: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.03)" }}>
                  <div className="w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center transition-all duration-300 shrink-0"
                    style={{ borderColor: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.2)", background: isSelected ? "#FFFFFF" : "transparent" }} />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium m-0 transition-colors duration-300" style={{ color: isSelected ? "#FFFFFF" : "#FDFBF7" }}>{station.name}</h4>
                    <p className="text-xs text-white/40 m-0 leading-relaxed">{station.subtitle || "Networking station"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {error && <p className="text-xs text-[#F97316] text-center mt-4 font-mono">{error}</p>}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-24 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-white/[0.02] px-6 flex items-center z-40">
        <div className="w-full max-w-md mx-auto">
          <button disabled={!canSubmit} onClick={handleFinalSubmission}
            className="w-full h-11 font-mono text-xs tracking-[0.22em] font-bold rounded-sm transition-all duration-300 text-center"
            style={{ background: canSubmit ? "#FFFFFF" : "rgba(255,255,255,0.02)", border: canSubmit ? "1px solid #F97316" : "1px solid rgba(255,255,255,0.05)", color: canSubmit ? "#000000" : "rgba(255,255,255,0.15)", cursor: canSubmit ? "pointer" : "not-allowed" }}>
            {saving ? "SAVING..." : "COMPLETE PROFILE"}
          </button>
        </div>
      </footer>

      {isPresenceOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col justify-end" onClick={() => setIsPresenceOpen(false)}>
          <div className="w-full bg-[#0E0E0E] border-t border-white/[0.06] rounded-t-xl p-6 max-w-md mx-auto space-y-3 animate-sheet-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-sm font-medium tracking-wide text-white/80 m-0">Professional Presence</h3>
              <button type="button" onClick={() => setIsPresenceOpen(false)} className="text-[10px] font-mono text-white/40 hover:text-white tracking-widest bg-transparent border-none cursor-pointer">CLOSE</button>
            </div>
            <input value={presence.linkedin} onChange={e => setPresence({ ...presence, linkedin: e.target.value })} placeholder="LinkedIn URL" style={inpStyle} className="focus-under" autoComplete="off" />
            <input value={presence.website} onChange={e => setPresence({ ...presence, website: e.target.value })} placeholder="Website URL" style={inpStyle} className="focus-under" autoComplete="off" />
            <input value={presence.portfolio} onChange={e => setPresence({ ...presence, portfolio: e.target.value })} placeholder="Portfolio URL" style={inpStyle} className="focus-under" autoComplete="off" />
            <button type="button" onClick={() => setIsPresenceOpen(false)} className="w-full h-11 bg-white/5 border border-white/10 rounded-sm font-mono text-[11px] tracking-widest text-[#FDFBF7] mt-4 cursor-pointer hover:bg-white/10 transition-colors">SAVE LINKS</button>
          </div>
        </div>
      )}

      {isIntentOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col justify-end" onClick={() => setIsIntentOpen(false)}>
          <div className="w-full bg-[#0E0E0E] border-t border-white/[0.06] rounded-t-xl p-6 max-w-md mx-auto space-y-3 animate-sheet-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-sm font-medium tracking-wide text-white/80 m-0">What Brings You Here?</h3>
              <button type="button" onClick={() => setIsIntentOpen(false)} className="text-[10px] font-mono text-white/40 hover:text-white tracking-widest bg-transparent border-none cursor-pointer">CLOSE</button>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {[
                { id: "Capital", label: "Capital", desc: "Fundraising, investors, and strategic ideas." },
                { id: "Synergy", label: "Synergy", desc: "Collaborators, co-founders, and deep execution partnerships." },
                { id: "Mentorship", label: "Mentorship", desc: "Actively seeking guidance or looking to offer perspective." },
                { id: "Opportunities", label: "Opportunities", desc: "Career growth, partnerships, and introductions." },
              ].map((item) => {
                const isActive = intents.includes(item.id);
                return (
                  <button type="button" key={item.id} onClick={() => toggleIntent(item.id)}
                    className="w-full text-left p-4 bg-white/[0.01] border border-white/[0.03] rounded-sm relative outline-none flex items-center transition-all duration-300"
                    style={{ paddingLeft: isActive ? "22px" : "16px" }}>
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#F97316] animate-slide-line" />}
                    <div>
                      <h4 className="text-sm font-medium m-0 transition-colors duration-300" style={{ color: isActive ? "#FFFFFF" : "#FDFBF7" }}>{item.label}</h4>
                      <p className="text-[11px] text-white/40 m-0 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => setIsIntentOpen(false)} className="w-full h-11 bg-white/5 border border-white/10 rounded-sm font-mono text-[11px] tracking-widest text-[#FDFBF7] mt-2 cursor-pointer hover:bg-white/10 transition-colors">CONFIRM SELECTION</button>
          </div>
        </div>
      )}
    </div>
  );
}
