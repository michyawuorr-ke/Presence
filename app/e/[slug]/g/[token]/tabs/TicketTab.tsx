"use client";

interface TicketTabProps {
  event: any;
  entryQR: string;
  networkingQR: string;
  qrError: boolean;
}

export default function TicketTab({ event, entryQR, networkingQR, qrError }: TicketTabProps) {
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
    </div>
  );
}
