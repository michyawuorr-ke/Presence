import { supabase } from "@/lib/supabase/client";

type SubmitGuestOnboardingParams = {
  registrationId: string;
  eventId: string;
  guestEmail: string | null | undefined;
  displayName: string;
  roleTitle: string;
  organisation: string;
  industry: string;
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
    // Check if a master profile already exists for this email.
    // We can't use upsert(..., { onConflict: "email" }) because
    // master_profiles also has a UNIQUE constraint on auth_user_id
    // and every guest row has auth_user_id = null — Postgres treats
    // all those nulls as distinct (per SQL standard) BUT the
    // Supabase PostgREST upsert path still trips over it.
    // Explicit select → update or insert is the safe path.
    const { data: existing } = await supabase
      .from("master_profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    const profileData = {
      display_name: params.displayName,
      role_title: params.roleTitle,
      organisation: params.organisation,
      industry: params.industry,
      bio: params.bio,
      linkedin_url: params.presence.linkedin,
      website_url: params.presence.website,
      portfolio_url: params.presence.portfolio,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { data: updated, error: updateErr } = await supabase
        .from("master_profiles")
        .update(profileData)
        .eq("id", existing.id)
        .select()
        .single();

      if (updateErr) {
        masterProfileError = updateErr.message;
      } else {
        masterProfile = updated;
      }
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("master_profiles")
        .insert({ email, ...profileData })
        .select()
        .single();

      if (insertErr) {
        masterProfileError = insertErr.message;
      } else {
        masterProfile = inserted;
      }
    }
  } else {
    masterProfileError = "No email on this registration — can't link a master profile.";
  }

  // Read the host's default_visibility policy to set networking_visible correctly.
  // This respects the host's configuration — not a code default.
  const { data: policy } = await supabase
    .from("event_policies")
    .select("default_visibility")
    .eq("event_id", params.eventId)
    .maybeSingle();
  const defaultVisibility = policy?.default_visibility ?? "visible";
  const networkingVisible = defaultVisibility === "visible";

  const { data, error } = await supabase
    .from("guest_profiles")
    .insert({
      registration_id: params.registrationId,
      event_id: params.eventId,
      display_name: params.displayName,
      role_title: params.roleTitle,
      organisation: params.organisation,
      industry: params.industry,
      bio: params.bio,
      platform_type: "link",
      platform_value:
        params.presence.linkedin.trim() ||
        params.presence.website.trim() ||
        params.presence.portfolio.trim() ||
        "",
      aura_active: false,
      networking_visible: networkingVisible,
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
