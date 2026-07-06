import { supabase } from "@/lib/supabase/client";
import { bootstrapHostProfile } from "./bootstrapHostProfile";

type LoadEntryResult = {
	  status: "not_found" | "onboarding" | "scene";
	    registration: any | null;
	      event: any | null;
	        stations: any[];
		  profile: any | null;
};

export async function loadEntry(token: string) {
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
					        } satisfies LoadEntryResult;
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

let { data: profile } = await supabase
  .from("guest_profiles")
    .select("*")
      .eq("registration_id", registration.id)
        .single();
	if (!profile && registration.status === "host") {
		  profile = await bootstrapHostProfile(registration);
	}
			      return {
				        status: profile ? "scene" : "onboarding",
					  registration,
					    event,
					      stations: stations ?? [],
					        profile,
			      } satisfies LoadEntryResult;
}
