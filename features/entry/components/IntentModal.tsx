type IntentModalProps = {
	  isOpen: boolean;
	    onClose: () => void;
	      intents: string[];
	        toggleIntent: (intent: string) => void;
};	

export default function IntentModal({
	  isOpen,
	    onClose,
	      intents,
	        toggleIntent,
}: IntentModalProps) {
	  return (
		      <>
		            {isOpen && (

	        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col justify-end" onClick={onClose}>                                  <div className="w-full bg-[#0E0E0E] border-t border-white/[0.06] rounded-t-xl p-6 max-w-md mx-auto space-y-3 animate-sheet-up" onClick={e => e.stopPropagation()}>                                                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
		              <h3 className="text-sm font-medium tracking-wide text-white/80 m-0">What Brings You Here?</h3>
			                    <button type="button" onClick={onClose} className="text-[10px] font-mono text-white/40 hover:text-white tracking-widest bg-transparent border-none cursor-pointer">CLOSE</button>
					                </div>                                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
							              {[
									                      { id: "Capital", label: "Capital", desc: "Fundraising, investors, and strategic ideas." },
											                      { id: "Synergy", label: "Synergy", desc: "Collaborators, co-founders, and deep execution partnerships." },
													                      { id: "Mentorship", label: "Mentorship", desc: "Actively seeking guidance or looking to offer perspective." },
															                      { id: "Opportunities", label: "Opportunities", desc: "Career growth, partnerships, and introductions." },                                                       ].map((item) => {
																		                      const isActive = intents.includes(item.id);                                                                 return (
																					                        <button type="button" key={item.id} onClick={() => toggleIntent(item.id)}
																								                    className="w-full text-left p-4 bg-white/[0.01] border border-white/[0.03] rounded-sm relative outline-none flex items-center transition-all duration-300"                                                              style={{ paddingLeft: isActive ? "22px" : "16px" }}>
																										                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#F97316] animate-slide-line" />}
																													                    <div>                                                   <h4 className="text-sm font-medium m-0 transition-colors duration-300" style={{ color: isActive ? "#FFFFFF" : "#FDFBF7" }}>{item.label}</h4>
																															                          <p className="text-[11px] text-white/40 m-0 mt-1 leading-relaxed">{item.desc}</p>                         </div>
																																		                    </button>
																																				                    );
																																						                  })}
																																								              </div>
																																									                  <button type="button" onClick={onClose} className="w-full h-11 bg-white/5 border border-white/10 rounded-sm font-mono text-[11px] tracking-widest text-[#FDFBF7] mt-2 cursor-pointer hover:bg-white/10 transition-colors">CONFIRM SELECTION</button>
																																											            </div>
																																												            </div>
																																													          )}
																																														            </>                                                     );
																																															    }
