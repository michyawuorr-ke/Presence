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

								    const payload = {
									        registration_id: reg.id,
										    event_id: reg.event_id,
										        display_name: hostProfile?.display_name || host.name || "Host",
											    role_title: hostProfile?.role_title || "",
											        organisation: hostProfile?.organisation || "",
												    bio: hostProfile?.bio || "",
												        platform_type: "link",
													    platform_value: hostProfile?.platform_value || "",
													        aura_active: false,
														  };

														    const { data: created, error: insertErr } = await supabase
														        .from("guest_profiles")
															    .insert(payload)
															        .select()
																    .single();
																    console.log("Created profile:", created);
																    console.log("Insert error:", insertErr);

																      if (created) return created;

																        if (insertErr) {
																		    const { data: existing } = await supabase
																		          .from("guest_profiles")
																			        .select("*")
																				      .eq("registration_id", reg.id)
																				            .single();

																					        return existing || null;
																						  }

																						    return null;
}
