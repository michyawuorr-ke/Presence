import { supabase } from "@/lib/supabase/client";

type SubmitGuestOnboardingParams = {
  registrationId: string;
  eventId: string;
  guestEmail: string | null | undefined;
  displayName: string;
  roleTitle: string;
  organisation: string;
  bio: string;
  presence: {
    linkedin: string;
    website: string;
    portfolio: string;
  };
  intents: string[];
  stationId: string | null;
};

export async function submitGuestOnboarding(params: SubmitGuestOnboardingParams) {
  // master_profiles is the canonical, cross-event identity record.
  // Upsert it first (keyed on email) so this guest is recognised at
  // future events without ever needing to log in.
  const email = params.guestEmail?.trim().toLowerCase() || null;
  let masterProfile: any = null;
  let masterProfileError: string | null = null;

  if (email) {
    const { data: updatedMaster, error: masterError } = await supabase
      .from("master_profiles")
      .upsert(
        {
          email,
          display_name: params.displayName,
          role_title: params.roleTitle,
          organisation: params.organisation,
          bio: params.bio,
          linkedin_url: params.presence.linkedin,
          website_url: params.presence.website,
          portfolio_url: params.presence.portfolio,
        },
        { onConflict: "email" }
      )
      .select()
      .single();

    // Don't block onboarding on this — the event-specific guest_profile
    // below is still the source of truth for THIS event either way.
    if (masterError) {
      console.error("Failed to upsert master_profiles:", masterError.message);
      masterProfileError = masterError.message;
    } else {
      masterProfile = updatedMaster;
    }
  } else {
    masterProfileError = "No email on this registration — can't link a master profile.";
  }

  const { data, error } = await supabase
    .from("guest_profiles")
    .insert({
      registration_id: params.registrationId,
      event_id: params.eventId,
      display_name: params.displayName,
      role_title: params.roleTitle,
      organisation: params.organisation,
      bio: params.bio,
      platform_type: "link",
      platform_value:
        params.presence.linkedin.trim() ||
        params.presence.website.trim() ||
        params.presence.portfolio.trim() ||
        "",
      aura_active: false,
      networking_intents: JSON.stringify(params.intents),
      target_station_id: params.stationId,
      linkedin_url: params.presence.linkedin,
      website_url: params.presence.website,
      portfolio_url: params.presence.portfolio,
    })
    .select()
    .single();

  if (error) throw error;

  return { guestProfile: data, masterProfile, masterProfileError };
}
