type Props = {
	   value: string;
	     label: string;
 };

 export default function Stat({ value, label }: Props) {
	   return (
		       <div style={{ textAlign: "center" }}>
		             <p
			             style={{
					               fontFamily: "var(--font-display)",
						                 fontSize: "clamp(28px,4vw,44px)",
								           fontWeight: 500,
									             color: "var(--ivory)",
										               letterSpacing: "-0.02em",
											                 margin: "0 0 6px",
													           lineHeight: 1,
														           }}
															         >
																         {value}
																	       </p>

																	             <p
																		             style={{
																				               fontSize: 11,
																					                 letterSpacing: "0.1em",
																							           textTransform: "uppercase",
																								             color: "var(--dusk)",
																									               margin: 0,
																										                 fontWeight: 500,
																												         }}
																													       >
																													               {label}
																														             </p>
																															         </div>
																																   );
 }
