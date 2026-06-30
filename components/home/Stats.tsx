import Stat from "./Stat";
import { stats } from "./statsData";

export default function Stats() {
	  return (
		      <section
		            style={{
				            borderTop: "1px solid rgba(138,115,85,0.12)",
					            borderBottom: "1px solid rgba(138,115,85,0.12)",
						            padding: "36px 32px",
							          }}
								      >
								            <div
									            className="stats-grid"
										            style={{
												              maxWidth: 1000,
													                margin: "0 auto",
															          display: "grid",
																            gridTemplateColumns: "repeat(4,1fr)",
																	              gap: 32,
																		              }}
																			            >
																				            {stats.map((item) => (
																						              <Stat
																							                  key={item.value}
																									              value={item.value}
																										                  label={item.sub}
																												            />
																													            ))}
																														          </div>
																															      </section>
																															        );
}
