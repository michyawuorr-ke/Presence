type PresenceModalProps = {
	  isOpen: boolean;
	    onClose: () => void;
	      presence: {
		          linkedin: string;
			      website: string;
			          portfolio: string;
				    };
				      setPresence: React.Dispatch<
				          React.SetStateAction<{
						        linkedin: string;
							      website: string;
							            portfolio: string;
								        }>
									  >;
									    inpStyle: React.CSSProperties;
};
export default function PresenceModal({
	  isOpen,
	    onClose,
	      presence,
	        setPresence,
		  inpStyle,
}: PresenceModalProps) {
	  return (
		  <>
		  {isOpen && (
			          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col justify-end" onClick={onClose}
				            <div className="w-full bg-[#0E0E0E] border-t border-white/[0.06] rounded-t-xl p-6 max-w-md mx-auto space-y-3 animate-sheet-up" onClick={e => e.stopPropagation()}>
					                <div className="flex justify-between items-center pb-2 border-b border-white/5">
							              <h3 className="text-sm font-medium tracking-wide text-white/80 m-0">Professional Presence</h3>
								                    <button type="button" onClick={() => setIsPresenceOpen(false)} className="text-[10px] font-mono text-white/40 hover:text-white tracking-widest bg-transparent border-none cursor-pointer">CLOSE</button>
										                </div>
												            <input value={presence.linkedin} onChange={e => setPresence({ ...presence, linkedin: e.target.value })} placeholder="LinkedIn URL" style={inpStyle} className="focus-under" autoComplete="off" />
													                <input value={presence.website} onChange={e => setPresence({ ...presence, website: e.target.value })} placeholder="Website URL" style={inpStyle} className="focus-under" autoComplete="off" />
															            <input value={presence.portfolio} onChange={e => setPresence({ ...presence, portfolio: e.target.value })} placeholder="Portfolio URL" style={inpStyle} className="focus-under" autoComplete="off" />
																                <button type="button" onClick={onClose} className="w-full h-11 bg-white/5 border border-white/10 rounded-sm font-mono text-[11px] tracking-widest text-[#FDFBF7] mt-4 cursor-pointer hover:bg-white/10 transition-colors">SAVE LINKS</button>
																		          </div>
																			          </div>
																				        )}

    </>
      );
}
