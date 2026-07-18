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
  const [masterProfile, setMasterProfile] = useState<any>(null);
  const [stations, setStations] = useState<Station[]>([]);

  // Onboarding form fields
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [industry, setIndustry] = useState("");
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
  const isStationValid = stations.length === 0 || stationId !== "";
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
        setMasterProfile(result.masterProfile);
        setStage("scene");
        return;
      }

      // Onboarding pre-fill: master profile is the canonical source
      // (guest_profiles doesn't exist yet for this event).
      const prefill = result.masterProfile ?? result.profile;
      if (prefill) {
        setMasterProfile(result.masterProfile ?? null);

        setDisplayName(prefill.display_name ?? "");
        setRole(prefill.role_title ?? "");
        setOrganisation(prefill.organisation ?? "");
        setIndustry(prefill.industry ?? "");
        setBio(prefill.bio ?? "");

        setPresence({
          linkedin: prefill.linkedin_url ?? "",
          website: prefill.website_url ?? "",
          portfolio: prefill.portfolio_url ?? "",
        });
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
      const result = await submitGuestOnboarding({
        registrationId: registration.id,
        eventId: event.id,
        guestEmail: registration.guest_email,
        displayName,
        roleTitle: role,
        organisation,
        industry,
        bio,
        presence,
        intents,
        stationId,
      });
      setProfile(result.guestProfile);
      if (result.masterProfile) setMasterProfile(result.masterProfile);
      if (result.masterProfileError) {
        // Non-blocking — this event's profile still saved fine — but
        // surface it so we can see the real reason cross-event
        // recognition isn't working, instead of it failing silently.
        alert("Note: cross-event profile sync failed — " + result.masterProfileError);
      }
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
        masterProfile={masterProfile}
        onProfileUpdate={setProfile}
        onMasterProfileUpdate={setMasterProfile}
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
        industry={industry}
        setIndustry={setIndustry}
        bio={bio}
        setBio={setBio}
        masterProfile={masterProfile}
        getPresenceLabel={getPresenceLabel}
        setIsPresenceOpen={setIsPresenceOpen}
        getIntentLabel={getIntentLabel}
        setIsIntentOpen={setIsIntentOpen}
        stations={stations}
        stationId={stationId}
        setStationId={setStationId}
        error={error}
        restoredIdentity={!!masterProfile}
        canSubmit={canSubmit}
        saving={saving}
        onSubmit={handleFinalSubmission}
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
