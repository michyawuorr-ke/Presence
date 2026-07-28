"use client";
import { useState } from "react";

interface TicketTabProps {
  event: any;
  registration: any;
  entryQR: string;
  networkingQR: string;
  qrError: boolean;
}

export default function TicketTab({ event, registration, entryQR, networkingQR, qrError }: TicketTabProps) {
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  async function sendAccessEmail() {
    if (!registration?.id || !event?.id) return;
    setEmailSending(true);
    try {
      const res = await fetch("/api/email/access-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_id: registration.id, event_id: event.id }),
      });
      const json = await res.json();
      if (json.sent) { setEmailSent(true); setTimeout(() => setEmailSent(false), 4000); }
    } finally {
      setEmailSending(false);
    }
  }

  function copyLink() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator.share({ title: event?.title + " — My Event Link", url }).catch(() => navigator.clipboard?.writeText(url));
    } else {
      navigator.clipboard?.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div style={{padding:"12px"}}>
      <p style={{fontSize:"10px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"12px",textAlign:"center"}}>Your Ticket</p>
      <div style={{background:"#141416",borderRadius:"20px",padding:"20px",border:"1px solid rgba(240,237,232,0.05)",boxShadow:"0 12px 40px rgba(0,0,0,0.5)",textAlign:"center",marginBottom:"8px"}}>
        <h2 style={{fontSize:"17px",fontWeight:"600",marginBottom:"2px"}}>{event?.title}</h2>
        <p style={{fontSize:"12px",color:"#666",marginBottom:"2px"}}>📍 {event?.venue}</p>
        <p style={{fontSize:"12px",color:"#999",marginBottom:"16px"}}>
          {event&&new Date(event.start_time).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"})}
        </p>
        <div style={{background:"#000",borderRadius:"10px",padding:"12px",marginBottom:"8px"}}>
          <p style={{color:"#fff",fontSize:"12px",fontWeight:"500",marginBottom:"4px"}}>Entry QR</p>
          <p style={{color:"#555",fontSize:"11px",marginBottom:"12px"}}>Show at entrance</p>
          {entryQR
            ? <img src={entryQR} style={{width:"130px",height:"130px",margin:"0 auto",display:"block"}}/>
            : qrError
            ? <p style={{color:"#F97316",fontSize:"12px"}}>Couldn't load QR — check your connection</p>
            : <p style={{color:"#666",fontSize:"12px"}}>Generating...</p>
          }
        </div>
        <details style={{background:"#111",borderRadius:"10px",padding:"12px",border:"1px solid rgba(240,237,232,0.03)"}}>
          <summary style={{listStyle:"none",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",userSelect:"none"}}>
            <div>
              <p style={{color:"#fff",fontSize:"12px",fontWeight:"500",margin:0}}>Networking QR</p>
              <p style={{color:"#555",fontSize:"11px",margin:"4px 0 0"}}>For profile unlocks · refreshes every minute</p>
            </div>
            <span style={{fontSize:"11px",color:"#FFBF00",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.05em",background:"rgba(255,255,255,0.05)",padding:"4px 8px",borderRadius:"6px"}}>Toggle ⊙</span>
          </summary>
          <div style={{marginTop:"12px",paddingTop:"12px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
            {networkingQR
              ? <img src={networkingQR} style={{width:"130px",height:"130px",margin:"0 auto",display:"block"}}/>
              : qrError
              ? <p style={{color:"#F97316",fontSize:"12px"}}>Couldn't load QR — check your connection</p>
              : <p style={{color:"#666",fontSize:"12px"}}>Generating...</p>
            }
          </div>
        </details>
      </div>

      {/* Re-entry link — this page URL IS the guest's access link */}
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"16px",padding:"16px",marginTop:"8px"}}>
        <p style={{fontSize:"10px",fontWeight:"700",letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",margin:"0 0 6px"}}>Your Access Link</p>
        <p style={{fontSize:"11px",color:"rgba(255,255,255,0.25)",margin:"0 0 12px",lineHeight:1.5}}>Save or share this link to return to the event anytime — no login needed.</p>
        <div style={{display:"flex",gap:"8px"}}>
          <button onClick={copyLink}
            style={{flex:1,padding:"11px",borderRadius:"10px",background:copied?"rgba(74,222,128,0.08)":"rgba(226,109,52,0.08)",border:`1px solid ${copied?"rgba(74,222,128,0.3)":"rgba(226,109,52,0.3)"}`,color:copied?"#4ade80":"#E26D34",fontSize:"12px",fontWeight:"600",cursor:"pointer"}}>
            {copied ? "✓ Copied" : "Copy Link"}
          </button>
          {registration?.guest_email && (
            <button onClick={sendAccessEmail} disabled={emailSending||emailSent}
              style={{flex:1,padding:"11px",borderRadius:"10px",background:emailSent?"rgba(74,222,128,0.08)":"rgba(255,255,255,0.04)",border:`1px solid ${emailSent?"rgba(74,222,128,0.3)":"rgba(255,255,255,0.08)"}`,color:emailSent?"#4ade80":"rgba(255,255,255,0.5)",fontSize:"12px",fontWeight:"600",cursor:emailSending||emailSent?"default":"pointer"}}>
              {emailSent?"✓ Sent":emailSending?"Sending...":"Email Me"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
