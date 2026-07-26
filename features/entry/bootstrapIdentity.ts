import { supabase } from "@/lib/supabase/client";

// Resolves identity for HOST registrations only. Guests are never
// authenticated via Supabase Auth (they only ever hold a registration
// access_token), so guest "returning visitor" recognition is handled
// separately in loadEntry.ts by matching the registration's email
// against master_profiles — not through this function.
export async function bootstrapIdentity(reg: any) {
  if (reg.status !== "host") {
    return null;
  }

  const { data: evFull } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", reg.event_id)
    .single();

  if (!evFull?.host_id) {
    throw new Error("No host_id found on event");
  }

  const { data: host } = await supabase
    .from("hosts")
    .select("*")
    .eq("id", evFull.host_id)
    .single();

  if (!host) {
    throw new Error("Host record not found");
  }

  const { data: hostProfile } = await supabase
    .from("host_profiles")
    .select("*")
    .eq("host_id", host.id)
    .single();

  // Upsert a guest_profiles row for the host so they participate in
  // the guest networking experience (node list, match scoring, handshakes)
  // using the same profile id as every other guest. Without this, all
  // networking queries break because they expect a guest_profiles.id.
  const { data: existingGuestProfile } = await supabase
    .from("guest_profiles")
    .select("*")
    .eq("registration_id", reg.id)
    .single();

  let guestProfile = existingGuestProfile;

  if (!guestProfile) {
    const { data: newGuestProfile } = await supabase
      .from("guest_profiles")
      .insert({
        registration_id: reg.id,
        event_id:        reg.event_id,
        display_name:    hostProfile?.display_name ?? host.name,
        role_title:      hostProfile?.role_title ?? "Event Host",
        organisation:    hostProfile?.organisation ?? "",
        bio:             hostProfile?.bio ?? "",
        linkedin_url:    hostProfile?.linkedin_url ?? null,
        website_url:     hostProfile?.website_url ?? null,
        portfolio_url:   hostProfile?.portfolio_url ?? null,
        role:            "organizer",
        networking_visible: true,
        aura_active:     false,
        show_linkedin:   true,
        show_website:    true,
        show_portfolio:  true,
      })
      .select()
      .single();
    guestProfile = newGuestProfile;
  }

  return {
    route:        "host",
    host,
    hostProfile,
    guestProfile,
  };
}
