"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { loadEntry } from "@/features/entry/loadEntry";
import { bootstrapIdentity } from "@/features/entry/bootstrapIdentity";
import { submitGuestOnboarding } from "@/features/entry/submitGuestOnboarding";
import EntryOnboardingScreen from "@/features/entry/components/EntryOnboardingScreen";
import PresenceModal from "@/features/entry/components/PresenceModal";
import IntentModal from "@/features/entry/components/IntentModal";
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

					if (result.profile) {
						    setProfile(result.profile);

						        setDisplayName(result.profile.display_name ?? "");
							    setRole(result.profile.role_title ?? "");
							        setOrganisation(result.profile.organisation ?? "");
								    setBio(result.profile.bio ?? "");

setPresence({
	  linkedin: result.profile.linkedin_url ?? "",
	    website: result.profile.website_url ?? "",
	      portfolio: result.profile.portfolio_url ?? "",
});

					}setStage("onboarding");
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
	masterProfile={profile}
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
									  restoredIdentity={!!profile}
									    />

<PresenceModal
  isOpen={isPresenceOpen}
    onClose={() => setIsPresenceOpen(false)}
      presence={presence}
        setPresence={setPresence}
	  />
<IntentModal
  isOpen={isIntentOpen}
    onClose={() => setIsIntentOpen(false)}
      intents={intents}
        toggleIntent={toggleIntent}
	/>
	  </>
);
}
