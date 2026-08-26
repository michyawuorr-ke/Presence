"use client";

interface Props {
  event: any;
  hostProfile: any;
  ticketTypes: any[];
  selectedTicket: any;
  onTicketChange: (t: any) => void;
  name: string; onName: (v: string) => void;
  email: string; onEmail: (v: string) => void;
  phone: string; onPhone: (v: string) => void;
  selfSelectRoles: string[];
  selectedRole: string; onRole: (v: string) => void;
  submitting: boolean;
  quantity: number;
  onQuantity: (v: number) => void;
  error: string;
  onSubmit: () => void;
}

const inp = {
  width:"100%", padding:"14px 0", background:"transparent",
  border:"1px solid transparent", borderBottom:"1px solid rgba(255,255,255,0.08)",
  color:"#fff", fontSize:"14px", outline:"none", marginBottom:"20px",
  boxSizing:"border-box" as const, borderRadius:0
};

const ROLE_LABELS: Record<string,string> = { attendee:"Attendee", speaker:"Speaker", vip:"VIP" };
const GOLD = "#D4AF37";

export default function RegistrationForm({ event, hostProfile, ticketTypes, selectedTicket, onTicketChange, name, onName, email, onEmail, phone, onPhone, selfSelectRoles, selectedRole, onRole, quantity, onQuantity, submitting, error, onSubmit }: Props) {
  return (
    <main style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",padding:"40px 24px",maxWidth:"420px",margin:"0 auto",justifyContent:"space-between"}}>
      <style>{`
        @keyframes organicFlow{0%{opacity:0;letter-spacing:-0.05em;transform:translateY(12px) scaleY(0.8);filter:blur(4px);}60%{opacity:0.8;letter-spacing:0.25em;filter:blur(1px);}100%{opacity:1;letter-spacing:0.2em;transform:translateY(0) scaleY(1);filter:blur(0);}}
        .living-tagline{font-size:11px;color:transparent;text-transform:uppercase;font-weight:500;margin:0;opacity:0;animation:organicFlow 1.6s cubic-bezier(0.25,1,0.5,1) forwards;animation-delay:0.4s;text-shadow:0 0 4px rgba(226,109,52,0.65),0 0 14px rgba(226,109,52,0.4);}
      `}</style>
      <div>
        <div style={{marginBottom:"40px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:"16px"}}>
          <p className="living-tagline">The room activated</p>
          <h1 style={{fontSize:"18px",fontWeight:"600",color:"#fff",letterSpacing:"0.08em",textTransform:"uppercase",marginTop:"24px",marginBottom:"6px"}}>Register</h1>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:"14px",margin:0}}>Event: {event.title}</p>
          {event.description && <p style={{color:"rgba(255,255,255,0.4)",fontSize:"12px",margin:"8px 0 0",textAlign:"center",maxWidth:"320px",lineHeight:1.6}}>{event.description}</p>}
        </div>

        {hostProfile && (
          <div style={{display:"flex",alignItems:"center",gap:"12px",background:"rgba(212,175,55,0.04)",border:"1px solid rgba(212,175,55,0.1)",borderRadius:"14px",padding:"14px",marginBottom:"28px"}}>
            <div style={{width:"40px",height:"40px",borderRadius:"50%",border:"1px solid rgba(212,175,55,0.3)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,background:"rgba(212,175,55,0.06)"}}>
              {hostProfile.avatar_url
                ? <img src={hostProfile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <span style={{fontSize:"15px",fontWeight:"700",color:GOLD}}>{hostProfile.display_name?.[0]?.toUpperCase()||"O"}</span>
              }
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px"}}>
                <p style={{fontSize:"13px",fontWeight:"600",color:"#f0ede8",margin:0}}>{hostProfile.display_name}</p>
                <span style={{display:"inline-flex",alignItems:"center",gap:"3px",fontSize:"8px",fontWeight:"800",color:GOLD,background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.2)",borderRadius:"3px",padding:"2px 6px",letterSpacing:"0.1em",flexShrink:0}}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>ORGANIZER
                </span>
              </div>
              {(hostProfile.role_title||hostProfile.organisation) && (
                <p style={{fontSize:"11px",color:"rgba(255,255,255,0.4)",margin:0}}>
                  {hostProfile.role_title}{hostProfile.role_title&&hostProfile.organisation?" · ":""}{hostProfile.organisation}
                </p>
              )}
            </div>
          </div>
        )}

        {ticketTypes.length > 0 && (
          <div style={{marginBottom:"8px",position:"relative",width:"100%"}}>
            <select value={selectedTicket?.id||""} onChange={e => onTicketChange(ticketTypes.find(t => t.id===e.target.value))} disabled={submitting}
              style={{width:"100%",padding:"14px 0",background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,0.08)",color:"#fff",fontSize:"14px",outline:"none",borderRadius:0,cursor:submitting?"not-allowed":"pointer",appearance:"none",WebkitAppearance:"none"}}>
              {ticketTypes.map(t => (
                <option key={t.id} value={t.id} style={{background:"#000",color:"#fff"}}>
                  {t.name} — {Number(t.price)<=0?"Complimentary":`${t.price} KES`}
                </option>
              ))}
            </select>
            <div style={{position:"absolute",right:"0",top:"50%",transform:"translateY(-50%)",color:"rgba(255,255,255,0.25)",fontSize:"11px",pointerEvents:"none"}}>[SELECT TIER]</div>
          </div>
        )}

        <input value={name} onChange={e=>onName(e.target.value)} placeholder="Your Name" type="text" disabled={submitting} style={inp}/>
        <input value={email} onChange={e=>onEmail(e.target.value)} placeholder="Email Address" type="email" disabled={submitting} style={inp}/>
        <input value={phone} onChange={e=>onPhone(e.target.value)} placeholder="M-Pesa Number (you'll pay with this)" type="tel" disabled={submitting} style={inp}/>

        {selectedTicket && Number(selectedTicket.price) > 0 && (
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:"1px solid rgba(255,255,255,0.08)",marginBottom:"20px"}}>
            <span style={{fontSize:"14px",color:"rgba(255,255,255,0.5)"}}>Quantity</span>
            <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
              <button type="button" onClick={()=>onQuantity(Math.max(1,quantity-1))} disabled={submitting||quantity<=1}
                style={{width:"32px",height:"32px",borderRadius:"50%",border:"1px solid rgba(255,255,255,0.15)",background:"transparent",color:"#fff",fontSize:"18px",cursor:quantity<=1?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:quantity<=1?0.3:1}}>−</button>
              <span style={{fontSize:"16px",fontWeight:"600",color:"#fff",minWidth:"20px",textAlign:"center"}}>{quantity}</span>
              <button type="button" onClick={()=>onQuantity(Math.min(10,quantity+1))} disabled={submitting||quantity>=10}
                style={{width:"32px",height:"32px",borderRadius:"50%",border:"1px solid rgba(255,255,255,0.15)",background:"transparent",color:"#fff",fontSize:"18px",cursor:quantity>=10?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:quantity>=10?0.3:1}}>+</button>
            </div>
            <span style={{fontSize:"14px",color:"#D4AF37",fontWeight:"600"}}>KES {Number(selectedTicket.price)*quantity}</span>
          </div>
        )}

        {selfSelectRoles.length > 1 && (
          <div style={{marginTop:"12px"}}>
            <p style={{fontSize:"11px",color:"rgba(255,255,255,0.45)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:"8px"}}>Attending as</p>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {selfSelectRoles.map((r:string) => (
                <button key={r} type="button" onClick={()=>onRole(r)} disabled={submitting}
                  style={{padding:"8px 16px",borderRadius:"8px",border:"1px solid",fontSize:"12px",fontWeight:"600",cursor:"pointer",
                    background:selectedRole===r?"rgba(212,175,55,0.12)":"transparent",
                    borderColor:selectedRole===r?"rgba(212,175,55,0.4)":"rgba(255,255,255,0.1)",
                    color:selectedRole===r?GOLD:"rgba(255,255,255,0.5)"}}>
                  {ROLE_LABELS[r]??r}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{width:"100%",marginBottom:"24px"}}>
        {error && <p style={{color:"#ef4444",fontSize:"12px",marginBottom:"16px",textAlign:"center"}}>{error}</p>}
        <button onClick={onSubmit} disabled={submitting}
          style={{width:"100%",padding:"14px",borderRadius:"6px",background:submitting?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.06)",color:submitting?"rgba(255,255,255,0.2)":"#ffffff",border:"1px solid rgba(255,255,255,0.15)",fontSize:"12px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",cursor:submitting?"not-allowed":"pointer"}}>
          {submitting ? "Processing..." : error==="Couldn't connect." ? "Try Again" : "Register"}
        </button>
        <p style={{lineHeight:"1.5",fontSize:"11px",color:"rgba(255,255,255,0.3)",textAlign:"center",marginTop:"16px",marginBottom:0}}>
          By continuing, you agree to our <a href="/terms" target="_blank" style={{color:"#888",textDecoration:"none"}}>Terms of Use</a> and <a href="/privacy" target="_blank" style={{color:"#888",textDecoration:"none"}}>Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}
