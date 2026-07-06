import { supabase } from "@/lib/supabase/client";

type SubmitGuestOnboardingParams = {
	  registrationId: string;
	    eventId: string;
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

export async function submitGuestOnboarding(
	  params: SubmitGuestOnboardingParams
) {
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
										      networking_intents: params.intents,
										            target_station_id: params.stationId,
											          linkedin_url: params.presence.linkedin,
												        website_url: params.presence.website,
													      portfolio_url: params.presence.portfolio,
													          })
														      .select()
														          .single();

															    if (error) throw error;

															      return data;
}
