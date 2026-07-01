"use client";

import Link from "next/link";
import React from "react";
export default function ForWho() {
	  return (
		      <section
		            style={{
				            padding: "100px 32px",
					            borderTop: "1px solid rgba(138,115,85,0.08)",
						            maxWidth: 1100,
							            margin: "0 auto",
								          }}
									      >
									            <div
										            data-reveal
											            data-delay="0"
												            style={{ marginBottom: 64, textAlign: "center" }}
													          >
														          <p className="eyebrow" style={{ marginBottom: 12 }}>
															            Who it&apos;s for
																	            </p>

																	            <h2
																		              style={{
																				                  fontFamily: "var(--font-display)",
																						              fontSize: "clamp(24px,3.5vw,44px)",
																							                  fontWeight: 500,
																									              color: "var(--ivory)",
																										                  letterSpacing: "-0.02em",
																												              lineHeight: 1.15,
																													                }}
																															        >
																																          Built for two kinds of ambition.
																																			          </h2>
																																		        </div>

																																		      <div
																																		              className="who-grid"
																																			              style={{
																																					                display: "grid",
																																							          gridTemplateColumns: "1fr 1fr",
																																								            gap: 16,
																																									            }}
																																										          >
																																											          {/* Organizers */}
																																												          <div
																																													            data-reveal
																																														              data-delay="0"
																																															                style={{
																																																		            background: "var(--obsidian)",
																																																			                borderRadius: 16,
																																																					            padding: "48px 40px",
																																																						                border: "1px solid rgba(212,175,55,0.1)",
																																																								            position: "relative",
																																																									                overflow: "hidden",
																																																											          }}
																																																												          >
																																																													            <div
																																																														                style={{
																																																																	              position: "absolute",
																																																																		                    top: 0,
																																																																				                  right: 0,
																																																																						                width: 200,
																																																																								              height: 200,
																																																																									                    background:
																																																																												                    "radial-gradient(circle at top right, rgba(212,175,55,0.06) 0%, transparent 70%)",
																																																																											                  pointerEvents: "none",
																																																																													              }}
																																																																														                />

																																																																																          <p
																																																																																	              style={{
																																																																																			                    fontSize: 10,
																																																																																					                  fontWeight: 700,
																																																																																							                letterSpacing: "0.14em",
																																																																																									              textTransform: "uppercase",
																																																																																										                    color: "var(--gold)",
																																																																																												                  marginBottom: 20,
																																																																																														              }}
																																																																																															                >
																																																																																																	            Organizers
																																																																																																		              </p>

																																																																																																			                <h3
																																																																																																					            style={{
																																																																																																							                  fontFamily: "var(--font-display)",
																																																																																																									                fontSize: "clamp(20px,2.5vw,32px)",
																																																																																																											              fontWeight: 500,
																																																																																																												                    color: "var(--ivory)",
																																																																																																														                  lineHeight: 1.2,
																																																																																																																                letterSpacing: "-0.015em",
																																																																																																																		              marginBottom: 20,
																																																																																																																			                  }}
																																																																																																																					            >
																																																																																																																						                Your event, elevated.
																																																																																																																									          </h3>

																																																																																																																								          <p
																																																																																																																									              style={{
																																																																																																																											                    color: "var(--dusk)",
																																																																																																																													                  fontSize: 14,
																																																																																																																															                lineHeight: 1.75,
																																																																																																																																	              marginBottom: 28,
																																																																																																																																		                  }}
																																																																																																																																				            >
																																																																																																																																					                Magic link entry. M-Pesa ticketing. Real-time dashboards.
																																																																																																																																								            See who is in the room and what connections are forming in real time.
																																																																																																																																									              </p>

																																																																																																																																							          <Link
																																																																																																																																								              href="/organizers"
																																																																																																																																									                  style={{
																																																																																																																																												                color: "var(--gold)",
																																																																																																																																														              fontSize: 13,
																																																																																																																																															                    fontWeight: 500,
																																																																																																																																																	                  textDecoration: "none",
																																																																																																																																																			              }}
																																																																																																																																																				                >
																																																																																																																																																						            For organizers →
																																																																																																																																																							              </Link>
																																																																																																																																																								              </div>

																																																																																																																																																									              {/* Attendees */}
																																																																																																																																																										              <div
																																																																																																																																																											                data-reveal
																																																																																																																																																													          data-delay="100"
																																																																																																																																																														            style={{
																																																																																																																																																																                background: "var(--obsidian)",
																																																																																																																																																																		            borderRadius: 16,
																																																																																																																																																																			                padding: "48px 40px",
																																																																																																																																																																					            border: "1px solid rgba(138,115,85,0.12)",
																																																																																																																																																																						                position: "relative",
																																																																																																																																																																								            overflow: "hidden",
																																																																																																																																																																									              }}
																																																																																																																																																																										              >
																																																																																																																																																																											                <div
																																																																																																																																																																													            style={{
																																																																																																																																																																															                  position: "absolute",
																																																																																																																																																																																	                top: 0,
																																																																																																																																																																																			              right: 0,
																																																																																																																																																																																				                    width: 200,
																																																																																																																																																																																						                  height: 200,
																																																																																																																																																																																								                background:
																																																																																																																																																																																											                "radial-gradient(circle at top right, rgba(138,115,85,0.05) 0%, transparent 70%)",
																																																																																																																																																																																										              pointerEvents: "none",
																																																																																																																																																																																											                  }}
																																																																																																																																																																																													            />

																																																																																																																																																																																														              <p
																																																																																																																																																																																															                  style={{
																																																																																																																																																																																																		                fontSize: 10,
																																																																																																																																																																																																				              fontWeight: 700,
																																																																																																																																																																																																					                    letterSpacing: "0.14em",
																																																																																																																																																																																																							                  textTransform: "uppercase",
																																																																																																																																																																																																									                color: "var(--dusk)",
																																																																																																																																																																																																											              marginBottom: 20,
																																																																																																																																																																																																												                  }}
																																																																																																																																																																																																														            >
																																																																																																																																																																																																															                Attendees
																																																																																																																																																																																																																	          </p>

																																																																																																																																																																																																																		            <h3
																																																																																																																																																																																																																			                style={{
																																																																																																																																																																																																																						              fontFamily: "var(--font-display)",
																																																																																																																																																																																																																							                    fontSize: "clamp(20px,2.5vw,32px)",
																																																																																																																																																																																																																									                  fontWeight: 500,
																																																																																																																																																																																																																											                color: "var(--ivory)",
																																																																																																																																																																																																																													              lineHeight: 1.2,
																																																																																																																																																																																																																														                    letterSpacing: "-0.015em",
																																																																																																																																																																																																																																                  marginBottom: 20,
																																																																																																																																																																																																																																		              }}
																																																																																																																																																																																																																																			                >
																																																																																																																																																																																																																																					            Connect without the chase.
																																																																																																																																																																																																																																							              </h3>

																																																																																																																																																																																																																																						              <p
																																																																																																																																																																																																																																							                  style={{
																																																																																																																																																																																																																																										                color: "var(--dusk)",
																																																																																																																																																																																																																																												              fontSize: 14,
																																																																																																																																																																																																																																													                    lineHeight: 1.75,
																																																																																																																																																																																																																																															                  marginBottom: 28,
																																																																																																																																																																																																																																																	              }}
																																																																																																																																																																																																																																																		                >
																																																																																																																																																																																																																																																				            Your profile lives in the room. Signal intent. Request connection.
																																																																																																																																																																																																																																																						                When both sides agree, a scan makes it real.
																																																																																																																																																																																																																																																								          </p>

																																																																																																																																																																																																																																																					              <Link
																																																																																																																																																																																																																																																						                  href="/attendees"
																																																																																																																																																																																																																																																								              style={{
																																																																																																																																																																																																																																																										                    color: "rgba(234,230,223,0.6)",
																																																																																																																																																																																																																																																												                  fontSize: 13,
																																																																																																																																																																																																																																																														                fontWeight: 500,
																																																																																																																																																																																																																																																																              textDecoration: "none",
																																																																																																																																																																																																																																																																	                  }}
																																																																																																																																																																																																																																																																			            >
																																																																																																																																																																																																																																																																				                For attendees →
																																																																																																																																																																																																																																																																						          </Link>
																																																																																																																																																																																																																																																																							          </div>
																																																																																																																																																																																																																																																																								        </div>
																																																																																																																																																																																																																																																																									    </section>
																																																																																																																																																																																																																																																																									      );
}
