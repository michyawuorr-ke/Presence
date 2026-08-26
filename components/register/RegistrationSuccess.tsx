"use client";
import { useState } from "react";

interface Props {
  event: any;
  selectedTicket: any;
  isFreeRegistration: boolean;
  confirmedToken: string;
  onSendEmail: () => Promise<void>;
}

export default function RegistrationSuccess({ event, selectedTicket, isFreeRegistration, confirmedToken, onSendEmail }: Props) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState("");

  async function handleEmail() {
    setEmailSending(true);
    try {
      await onSendEmail();
      setEmailSent(true);
    } catch {
      setEmailError("Could not send — copy the link instead.");
      setTimeout(() => setEmailError(""), 4000);
    } finally {
      setEmailSending(false);
    }
  }

  const link = typeof window !== "undefined"
    ? window.location.origin + "/e/" + event?.slug + "/g/" + confirmedToken
    : "";

  return (
    <main style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",background:"#0a0a0a"}}>
      <div style={{maxWidth:"380px",width:"100%",padding:"40px 24px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"24px",textAlign:"center"}}>
        {isFreeRegistration && (
          <div style={{width:56,height:56,margin:"0 auto 20px",borderRadius:"50%",background:"rgba(74,222,128,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
        )}
        <h2 style={{fontSize:"24px",fontWeight:"400",color:"#f5f5f5",marginBottom:"6px",marginTop:isFreeRegistration?0:"8px"}}>
          {isFreeRegistration ? "You're In" : "Payment Submitted"}
        </h2>
        <p style={{color:"var(--ember, #E26D34)",fontSize:"16px",fontWeight:"600",marginBottom:"24px"}}>{event?.title}</p>
        <p style={{color:"#a3a3a3",fontSize:"14px",lineHeight:"1.5",marginBottom:"32px"}}>
          {isFreeRegistration ? "Your spot is confirmed. Head straight into the event." : "Pending host verification."}
        </p>
        <div style={{background:"rgba(0,0,0,0.15)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"14px",padding:"24px",marginBottom:"36px",textAlign:"left"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px",fontSize:"13px"}}>
            <span style={{color:"rgba(255,255,255,0.4)"}}>Ticket:</span>
            <span style={{color:"#f5f5f5",fontWeight:"500"}}>{selectedTicket?.name || "General"}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px"}}>
            <span style={{color:"rgba(255,255,255,0.4)"}}>Status:</span>
            <span style={{color:isFreeRegistration?"#4ade80":"#D4AF37",fontWeight:"500"}}>
              {isFreeRegistration ? "Confirmed" : "Pending Verification"}
            </span>
          </div>
        </div>
        {confirmedToken && (
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"12px",padding:"16px",marginBottom:"16px",textAlign:"left"}}>
            <p style={{fontSize:"10px",fontWeight:"700",letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.35)",margin:"0 0 8px"}}>Your Event Link</p>
            <p style={{fontSize:"11px",color:"rgba(255,255,255,0.25)",margin:"0 0 14px",lineHeight:1.5}}>Save this link — it's how you get back into the event anytime.</p>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              <button onClick={() => navigator.clipboard?.writeText(link).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); })}
                style={{width:"100%",padding:"12px",background:linkCopied?"rgba(74,222,128,0.08)":"rgba(226,109,52,0.1)",color:linkCopied?"#4ade80":"#E26D34",border:`1px solid ${linkCopied?"rgba(74,222,128,0.3)":"rgba(226,109,52,0.3)"}`,borderRadius:"8px",fontSize:"13px",fontWeight:"600",cursor:"pointer"}}>
                {linkCopied ? "✓ Copied" : "Copy Link"}
              </button>
              {!emailSent && (
                <button onClick={handleEmail} disabled={emailSending}
                  style={{width:"100%",padding:"8px",background:"transparent",color:"rgba(255,255,255,0.3)",border:"none",fontSize:"11px",fontWeight:"500",cursor:emailSending?"default":"pointer",textDecoration:"underline"}}>
                  {emailSending ? "Sending..." : "Email me this link"}
                </button>
              )}
              {emailSent && <p style={{textAlign:"center",fontSize:"11px",color:"#4ade80",margin:0}}>✓ Sent to your email</p>}
              {emailError && <p style={{textAlign:"center",fontSize:"11px",color:"#f87171",margin:0}}>{emailError}</p>}
            </div>
          </div>
        )}
        <button onClick={() => { if (confirmedToken) window.location.href = link; }}
          style={{width:"100%",padding:"16px",background:isFreeRegistration?"rgba(74,222,128,0.08)":"rgba(255,255,255,0.05)",color:"#f5f5f5",border:`1px solid ${isFreeRegistration?"rgba(74,222,128,0.3)":"rgba(255,255,255,0.12)"}`,borderRadius:"12px",fontSize:"13px",fontWeight:"600",letterSpacing:"0.05em",textTransform:"uppercase",cursor:"pointer"}}>
          Enter Event
        </button>
      </div>
    </main>
  );
}
