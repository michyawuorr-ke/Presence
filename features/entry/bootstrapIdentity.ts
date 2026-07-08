import { supabase } from "@/lib/supabase/client";

export async function bootstrapIdentity(reg: any) {
	  const { data: evFull } = await supabase
	      .from("events")
	          .select("host_id")
		      .eq("id", reg.event_id)
		          .single();
			  console.log("Event lookup:", evFull);

			  if (!evFull?.host_id) {
				    throw new Error("No host_id found on event");
			  }

			      const { data: host } = await supabase
			          .from("hosts")
				      .select("*")
				          .eq("id", evFull.host_id)
					      .single();
					      console.log("Host lookup:", host);

if (!host) {
	  throw new Error("Host record not found");
}
						  const { data: hostProfile } = await supabase
						      .from("host_profiles")
						          .select("*")
							      .eq("host_id", host.id)
							          .single();
								  console.log("Host profile lookup:", hostProfile);

								  return {
									    route: "host",
									      host,
									        hostProfile,
								  };
}
