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

  return {
    route: "host",
    host,
    hostProfile,
  };
}
