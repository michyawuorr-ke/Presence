"use client";
import { useState } from "react";

interface TicketTabProps {
  event: any;
  registration: any;
  entryQR: string;
  networkingQR: string;
  qrError: boolean;
  isEnded?: boolean;
  onGoToScene?: () => void;
  onGoToConnections?: () => void;
}

export default function TicketTab({ event, registration, entryQR, networkingQR, qrError, isEnded, onGoToScene, onGoToConnections }: TicketTabProps) {
  const [copied, setCopied] = useState(false););
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

  if (isEnded) {
    const tierName = registration?.ticket_types?.name || "General";
    const amount = registration?.amount ?? registration?.ticket_types?.price;
    const eventDate = event?.start_time
      ? new Date(event.start_time).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
      : "";
    return (
      <div style={{ padding: "16px" }}>
        <p style={{ fontSize: "10px", letterSpacing: "0.3em", color: "#999", textTransform: "uppercase", marginBottom: "16px", textAlign: "center" }}>Your Ticket Stub</p>

        {/* Stub styling: a torn/perforated line splits the card into a main
            section and a smaller counterfoil, echoing a physical ticket you'd
            keep as a memento — the QR/entry section is gone entirely since
            it's meaningless after the event, this is now purely a keepsake. */}
        <div style={{ background: "#141416", borderRadius: "20px", border: "1px solid rgba(240,237,232,0.05)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <div style={{ padding: "24px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.15em", color: "#8A7355", textTransform: "uppercase", margin: "0 0 10px" }}>Admit One · Attended</p>
            <h2 style={{ fontSize: "19px", fontWeight: "700", color: "#f0ede8", margin: "0 0 6px" }}>{event?.title}</h2>
            <p style={{ fontSize: "12px", color: "#777", margin: "0 0 2px" }}>📍 {event?.venue}</p>
            <p style={{ fontSize: "12px", color: "#999", margin: 0 }}>{eventDate}</p>
          </div>

          {/* Perforated divider */}
          <div style={{ position: "relative", height: "1px" }}>
            <div style={{ position: "absolute", left: "-10px", top: "-10px", width: "20px", height: "20px", borderRadius: "50%", background: "#0a0a0b" }} />
            <div style={{ position: "absolute", right: "-10px", top: "-10px", width: "20px", height: "20px", borderRadius: "50%", background: "#0a0a0b" }} />
            <div style={{ borderTop: "1.5px dashed rgba(255,255,255,0.12)", margin: "0 20px" }} />
          </div>

          <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "9px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Ticket</p>
              <p style={{ fontSize: "13px", color: "#f0ede8", fontWeight: "600", margin: 0 }}>{tierName}</p>
            </div>
            {amount != null && (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "9px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Paid</p>
                <p style={{ fontSize: "13px", color: "#f0ede8", fontWeight: "600", margin: 0 }}>KES {Number(amount).toLocaleString()}</p>
              </div>
            )}
          </div>
          {registration?.mpesa_receipt && (
            <div style={{ padding: "0 20px 18px" }}>
              <p style={{ fontSize: "10px", color: "#444", margin: 0 }}>Receipt: {registration.mpesa_receipt}</p>
            </div>
          )}
        </div>

        {/* Links back into the memory thread — Scene and Connections keep
            the ticket from being a dead end. */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
          {onGoToScene && (
            <button onClick={onGoToScene}
              style={{ padding: "13px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,237,232,0.8)", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>
              Relive the event →
            </button>
          )}
          {onGoToConnections && (
            <button onClick={onGoToConnections}
              style={{ padding: "13px", borderRadius: "12px", background: "rgba(226,109,52,0.06)", border: "1px solid rgba(226,109,52,0.2)", color: "#E26D34", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>
              See who you connected with →
            </button>
          )}
        </div>
      </div>
    );
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
