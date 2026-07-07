"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { loadEntry } from "@/features/entry/loadEntry";
import { bootstrapHostProfile } from "@/features/entry/bootstrapHostProfile";
import { submitGuestOnboarding } from "@/features/entry/submitGuestOnboarding";
import EntryOnboardingScreen from "@/features/entry/components/EntryOnboardingScreen";
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
  const getPresenceLabel = () => {
	    const added = [];
	      if (presence.linkedin.trim()) added.push("LinkedIn");
	        if (presence.website.trim()) added.push("Website");
		  if (presence.portfolio.trim()) added.push("Portfolio");
		    return added.length === 0 ? "Add Professional Links" : `${added.join(" • ")} Linked`;
  };

  const getIntentLabel = () =>
    intents.length === 0 ? "Select Intent" : intents.join(" + ");

    const toggleIntent = (id: string) => {
	      setIntents(prev =>
			     prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
			       );
    };

    const isIdentityValid = displayName.trim() !== "" && role.trim() !== "";
    const isPresenceValid =
	      presence.linkedin.trim() !== "" ||
	        presence.website.trim() !== "" ||
		  presence.portfolio.trim() !== "";
    const isIntentValid = intents.length > 0;
    const isStationValid = stationId !== "";
    const canSubmit =
	      isIdentityValid &&
	        isPresenceValid &&
		  isIntentValid &&
		    isStationValid &&
		      !saving;

  // Resolve token -> registration -> event -> existing profile (gates onboarding vs scene)
useEffect(() => {
	  if (!token) return;

	    async function run() {
		        const result = await loadEntry(token);

			    setRegistration(result.registration);
			        setEvent(result.event);
				    setStations(result.stations);

				        if (result.status === "not_found") {
						      setStage("not_found");
						            return;
							        }

								    if (result.status === "scene") {
									          setProfile(result.profile);
										        setStage("scene");
											      return;
											          }

												      setStage("onboarding");
												        }

													  run();
}, [token]);
  async function handleFinalSubmission() {
    if (!canSubmit || !registration || !event) return;
    setSaving(true);
    setError("");
    try {
	    const data = await submitGuestOnboarding({
		      registrationId: registration.id,
		        eventId: event.id,
			  displayName,
			    roleTitle: role,
			      organisation,
			        bio,
				  presence,
				    intents,
				      stationId,
	    });
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

return (

	<>
	  <EntryOnboardingScreen
	      displayName={displayName}
	          setDisplayName={setDisplayName}
		      role={role}
		          setRole={setRole}
			      organisation={organisation}
			          setOrganisation={setOrganisation}
				      bio={bio}
				          setBio={setBio}
					      getPresenceLabel={getPresenceLabel}
					          setIsPresenceOpen={setIsPresenceOpen}
						      getIntentLabel={getIntentLabel}
						          setIsIntentOpen={setIsIntentOpen}
							      stations={stations}
							          stationId={stationId}
								      setStationId={setStationId}
								          error={error}
									    />

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
          </>
	    );
}
