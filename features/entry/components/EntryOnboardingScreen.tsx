

type EntryOnboardingScreenProps = {
	  displayName: string;
	    setDisplayName: React.Dispatch<React.SetStateAction<string>>;
	      role: string;
	        setRole: React.Dispatch<React.SetStateAction<string>>;
		  organisation: string;
		    setOrganisation: React.Dispatch<React.SetStateAction<string>>;
		      bio: string;
		        setBio: React.Dispatch<React.SetStateAction<string>>;
			masterProfile?: any;

			  getPresenceLabel: () => string;
			    setIsPresenceOpen: React.Dispatch<React.SetStateAction<boolean>>;
			      getIntentLabel: () => string;
			        setIsIntentOpen: React.Dispatch<React.SetStateAction<boolean>>;
				  stations: any[];
				    stationId: string;
				      setStationId: React.Dispatch<React.SetStateAction<string>>;
				        error: string;
					restoredIdentity?: boolean;
};

export default function EntryOnboardingScreen({
	  displayName,
	    setDisplayName,
	      role,
	        setRole,
		  organisation,
		    setOrganisation,
		    bio,
		    setBio,
		    masterProfile,
		  getPresenceLabel,
			    setIsPresenceOpen,
			      getIntentLabel,
			        setIsIntentOpen,
				  stations,
				    stationId,
				      setStationId,
				        error,
					restoredIdentity,
}: EntryOnboardingScreenProps) {
  const inpStyle = {
    width: "100%", padding: "10px 0", background: "transparent", border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#FDFBF7",
    fontSize: "14px", outline: "none", borderRadius: 0, transition: "border-color 0.3s",
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FDFBF7] px-6 flex flex-col items-center box-border select-none relative overflow-x-hidden">
      <style>{`
        @keyframes slideUpLine { from { height: 0%; } to { height: 100%; } }
        @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-line { animation: slideUpLine 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-sheet-up { animation: sheetUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .focus-under:focus { border-bottom: 1px solid #F97316 !important; }
      `}</style>

      <header className="w-full pt-12 max-w-md mx-auto text-center">
        <p className="text-[10px] font-bold tracking-[0.3em] text-[#8A7355] m-0 uppercase">OREETI</p>
      </header>

      <main className="w-full max-w-md mx-auto flex-1 pt-8 pb-36 overflow-y-auto">
      {masterProfile && (
	        <section className="mb-6 rounded-md border border-[#E26D34]/20 bg-[#E26D34]/5 p-5">
		    <p className="text-[10px] uppercase tracking-[0.25em] text-[#E26D34] font-semibold">
		          Welcome Back
			      </p>

			          <h2 className="mt-2 text-xl font-semibold text-white">
				        Welcome back, {masterProfile.display_name}
					    </h2>

					        <p className="mt-2 text-sm font-medium text-white/80">
						      Your Oreeti profile is ready.
							          </p>

						          <p className="mt-1 text-sm leading-6 text-white/60">
							        Complete your event details below and step into the room.
									    </p>
								  </section>
      )}
        <section className="mb-6 bg-white/[0.01] border border-white/[0.03] p-5 rounded-md space-y-3">
          <h2 className="text-sm font-medium tracking-tight text-white/80 m-0">About You</h2>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your Name" style={inpStyle} className="focus-under" autoComplete="off" />
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Role or Title" style={inpStyle} className="focus-under" autoComplete="off" />
          <input value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Organisation / Studio" style={inpStyle} className="focus-under" autoComplete="off" />
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short Bio" rows={2} style={{ ...inpStyle, height: "54px", resize: "none" }} className="focus-under" autoComplete="off" />
        </section>

        <section className="mb-6">
          <label className="block text-[10px] font-mono tracking-wider text-white/30 uppercase mb-2">Professional Presence</label>
          <button type="button" onClick={() => setIsPresenceOpen(true)}
            className="w-full flex items-center justify-between p-4 bg-white/[0.01] border border-white/[0.04] rounded-sm text-left transition-all duration-300 hover:border-white/10"
            style={{ color: "#FDFBF7" }}>
            <span className="text-sm font-light tracking-wide">{getPresenceLabel()}</span>
            <span className="text-[10px] font-mono tracking-widest text-white/20">MANAGE</span>
          </button>
        </section>

        <section className="mb-10">
          <label className="block text-[10px] font-mono tracking-wider text-white/30 uppercase mb-2">What Brings You Here?</label>
          <button type="button" onClick={() => setIsIntentOpen(true)}
            className="w-full flex items-center justify-between p-4 bg-white/[0.01] border border-white/[0.04] rounded-sm text-left transition-all duration-300 hover:border-white/10"
            style={{ color: "#FDFBF7" }}>
            <span className="text-sm font-light tracking-wide">{getIntentLabel()}</span>
            <span className="text-[10px] font-mono tracking-widest text-white/20">SELECT</span>
          </button>
        </section>

        <section className="mb-6">
          <label className="block text-[10px] font-mono tracking-wider text-white/30 uppercase mb-3">Networking Station</label>
          <div className="space-y-3">
            {stations.length === 0 ? (
              <div className="p-4 border border-white/5 rounded-sm bg-white/[0.01] text-center">
                <p className="text-xs text-white/30 m-0 italic">No stations configured for this event yet.</p>
              </div>
            ) : stations.map((station) => {
              const isSelected = stationId === station.id;
              return (
                <button type="button" key={station.id} onClick={() => setStationId(station.id)}
                  className="w-full text-left p-4 rounded-sm border flex items-start gap-4 transition-all duration-300 outline-none"
                  style={{ background: isSelected ? "rgba(249,115,22,0.02)" : "rgba(255,255,255,0.01)", borderColor: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.03)" }}>
                  <div className="w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center transition-all duration-300 shrink-0"
                    style={{ borderColor: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.2)", background: isSelected ? "#FFFFFF" : "transparent" }} />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium m-0 transition-colors duration-300" style={{ color: isSelected ? "#FFFFFF" : "#FDFBF7" }}>{station.name}</h4>
                    <p className="text-xs text-white/40 m-0 leading-relaxed">{station.subtitle || "Networking station"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {error && <p className="text-xs text-[#F97316] text-center mt-4 font-mono">{error}</p>}
      </main>
          </div>
	    );
}

