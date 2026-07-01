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
																		                background: "transparent",
																				        }}
																					      >
																					              {stats.map((s) => (
																							                <div
																									            key={s.value}
																										                style={{
																													              padding: "20px 16px",
																														                    background: "transparent",
																																                  textAlign: "center",
																																		                display: "flex",
																																				              flexDirection: "column",
																																					                    alignItems: "center",
																																							                  gap: 10,
																																									              }}
																																										                >
																																												            <p
																																													                  style={{
																																																                  fontFamily: "var(--font-display)",
																																																		                  fontSize: "clamp(16px,2vw,24px)",
																																																				                  fontWeight: 500,
																																																						                  color: "#E26D34",
																																																								                  letterSpacing: "-0.02em",
																																																										                  margin: 0,
																																																												                  lineHeight: 1.1,
																																																														                }}
																																																																            >
																																																																	                  {s.value}
																																																																			              </p>

																																																																				                  <p
																																																																						                style={{
																																																																									                fontSize: 12,
																																																																											                color: "rgba(138,115,85,0.7)",
																																																																													                letterSpacing: "0.04em",
																																																																															                margin: 0,
																																																																																	                lineHeight: 1.5,
																																																																																			                maxWidth: 120,
																																																																																					              }}
																																																																																						                  >
																																																																																								                {s.sub}
																																																																																										            </p>
																																																																																											              </div>
																																																																																												              ))}
																																																																																													            </div>
																																																																																														        </section>
																																																																																															  );
}
