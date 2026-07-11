import { supabase } from "@/lib/supabase/client";
import { bootstrapIdentity } from "./bootstrapIdentity";

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
  masterProfile: any | null;
};

async function resolveMasterProfile(): Promise<any | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: masterProfile } = await supabase
    .from("master_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return masterProfile ?? null;
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

  const { data: profile } = await supabase
    .from("guest_profiles")
    .select("*")
    .eq("registration_id", registration.id)
    .single();

  // Already onboarded for this event — still resolve the real master
  // profile so profile editing has the correct canonical record to
  // read from and write to.
  if (profile) {
    const masterProfile = await resolveMasterProfile();
    return {
      status: "scene",
      registration,
      event,
      stations: stations ?? [],
      profile,
      masterProfile,
    };
  }

  const identity = await bootstrapIdentity(registration);

  if (!identity) {
    return {
      status: "onboarding",
      registration,
      event,
      stations: stations ?? [],
      profile: null,
      masterProfile: null,
    };
  }

  if (identity.route === "host") {
    return {
      status: "scene",
      registration,
      event,
      stations: stations ?? [],
      profile: identity.hostProfile,
      masterProfile: null,
    };
  }

  if (identity.route === "scene") {
    return {
      status: "scene",
      registration,
      event,
      stations: stations ?? [],
      profile: identity.guestProfile,
      masterProfile: identity.masterProfile,
    };
  }

  if (identity.route === "event_onboarding") {
    return {
      status: "onboarding",
      registration,
      event,
      stations: stations ?? [],
      // Onboarding form pre-fill comes from the master profile; no
      // per-event guest profile exists yet.
      profile: null,
      masterProfile: identity.masterProfile,
    };
  }

  return {
    status: "onboarding",
    registration,
    event,
    stations: stations ?? [],
    profile: null,
    masterProfile: null,
  };
}
