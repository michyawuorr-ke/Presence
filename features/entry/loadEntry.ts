import { supabase } from "@/lib/supabase/client";
import { bootstrapIdentity } from "./bootstrapIdentity";
import { isHostRegistration } from "@/lib/hostRole";

type LoadEntryResult = {
  status: "not_found" | "onboarding" | "scene";
  registration: any | null;
  event: any | null;
  stations: any[];
  profile: any | null;
  // The canonical, cross-event identity record (master_profiles).
  // This is the primary source of truth for a person's identity
  // (name, role, bio, links). `profile` above is the per-event
  // overlay (guest_profiles) and is secondary.
  //
  // Guests never sign in. If they've already onboarded for this event,
  // this resolves via guest_profiles.master_profile_id directly. If not,
  // there's no FK yet to follow, so it falls back to matching the
  // registration's email against master_profiles.email to recognise a
  // returning guest from a previous event.
  masterProfile: any | null;
};

async function findMasterProfileByEmail(email: string | null | undefined) {
  if (!email) return null;
  const { data } = await supabase
    .from("master_profiles")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return data ?? null;
}

async function findMasterProfileById(id: string | null | undefined) {
  if (!id) return null;
  const { data } = await supabase
    .from("master_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export async function loadEntry(token: string): Promise<LoadEntryResult> {
  const { data: registration, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("access_token", token)
    .single();

  if (error || !registration) {
    return {
      status: "not_found",
      registration: null,
      event: null,
      stations: [],
      profile: null,
      masterProfile: null,
    };
  }

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", registration.event_id)
    .single();

  const { data: stations } = await supabase
    .from("event_stations")
    .select("id, name, subtitle")
    .eq("event_id", registration.event_id);

  // Early-access gate: if the event hasn't gone live yet, only hosts
  // and roles with bypass_visibility (VIP, Speaker, etc.) can enter.
  // Regular attendees get a "not started yet" holding screen.
  if (event?.status === "upcoming") {
    const isHost = isHostRegistration(registration);
    const role = registration.role ?? "attendee";
    const isPrivileged = isHost || ["vip", "speaker"].includes(role);

    if (!isPrivileged) {
      return {
        status: "not_started",
        registration,
        event,
        stations: stations ?? [],
        profile: null,
        masterProfile: null,
      } as any;
    }
  }

  // Host registrations route through bootstrapIdentity's host branch.
  if (isHostRegistration(registration)) {
    const identity = await bootstrapIdentity(registration);
    return {
      status: "scene",
      registration,
      event,
      stations: stations ?? [],
      profile: identity?.guestProfile ?? identity?.hostProfile ?? null,
      masterProfile: null,
    };
  }

  // Already onboarded for THIS event.
  const { data: profile } = await supabase
    .from("guest_profiles")
    .select("*")
    .eq("registration_id", registration.id)
    .single();

  if (profile) {
    // guest_profiles now carries master_profile_id directly (person-model
    // Stage 1), so resolve by id instead of re-deriving via email — no
    // risk of a case/typo mismatch, and one less join. Falls back to the
    // email match only for rows created before that column existed and
    // never got backfilled.
    const masterProfile = profile.master_profile_id
      ? await findMasterProfileById(profile.master_profile_id)
      : await findMasterProfileByEmail(registration.guest_email);
    return {
      status: "scene",
      registration,
      event,
      stations: stations ?? [],
      profile,
      masterProfile,
    };
  }

  // Not yet onboarded for this event — there's no guest_profiles row yet,
  // so there's no master_profile_id to follow. Unlike the case above, this
  // one is a genuine first-touch identity lookup with nothing else to key
  // on, not the same avoidable email round-trip: if this email has been to
  // a previous Oreeti event, prefill from their master profile so they
  // only need to fill in event-specific bits.
  const masterProfile = await findMasterProfileByEmail(registration.guest_email);

  return {
    status: "onboarding",
    registration,
    event,
    stations: stations ?? [],
    profile: null,
    masterProfile,
  };
}
