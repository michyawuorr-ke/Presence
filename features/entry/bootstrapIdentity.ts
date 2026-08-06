import { supabase } from "@/lib/supabase/client";
import { createClient } from "@supabase/supabase-js";

// Service role client — needed to bypass RLS when creating the host
// guest_profiles row. Only used server-side (bootstrapIdentity is called
// from loadEntry which runs in a useEffect, never during SSR).
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

  // Try to read existing guest_profiles row for this host registration.
  // go-live creates it for new registrations; for existing ones we call
  // the server API which uses service role to create it if missing.
  let { data: guestProfile } = await supabase
    .from("guest_profiles")
    .select("*")
    .eq("registration_id", reg.id)
    .maybeSingle();

  if (!guestProfile) {
    try {
      const svc = getServiceClient();
      const { data: created, error: insertErr } = await svc
        .from("guest_profiles")
        .insert({
          registration_id: reg.id,
          event_id:        reg.event_id,
          display_name:    hostProfile?.display_name ?? host.name ?? "Host",
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
      if (!insertErr) guestProfile = created;
    } catch(e) {
      console.warn("Could not create host guest_profile:", e);
    }
  }

  return {
    route:        "host",
    host,
    hostProfile,
    guestProfile,
  };
}
