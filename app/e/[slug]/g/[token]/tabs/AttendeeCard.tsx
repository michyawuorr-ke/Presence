"use client";

// Role badge colours — only styling here, no behaviour branching on role name.
// The badge emoji and label come from the database via the attendee object.
const ROLE_BADGE_STYLE = {
  fontSize: "9px",
  fontWeight: "700",
  letterSpacing: "0.08em",
  color: "#D4AF37",
  background: "rgba(212,175,55,0.08)",
  border: "1px solid rgba(212,175,55,0.18)",
  borderRadius: "4px",
  padding: "2px 6px",
};

interface AttendeeCardProps {
  attendee: any;
  sent: boolean;
  onConnect: () => void;
  live?: boolean;
}

export default function AttendeeCard({ attendee, sent, onConnect, live }: AttendeeCardProps) {
  // role badge: comes from attendee.role (id) + attendee.role_badge (emoji)
  // Falls back gracefully if not set — no hardcoded role list here.
  const showBadge = attendee.role && attendee.role !== "attendee" && attendee.role_badge;

  return(
    <div style={{background:"#1C1C1E",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
            {live&&<span style={{width:"7px",height:"7px",borderRadius:"50%",background:"#4ade80",display:"inline-block",animation:"pulse 2s infinite",flexShrink:0}}/>}
            <p style={{fontSize:"14px",fontWeight:"600",color:"#f1f0f5",margin:0}}>{attendee.display_name}</p>
            {showBadge && (
              <span style={ROLE_BADGE_STYLE}>
                {attendee.role_badge} {attendee.role_label?.toUpperCase() ?? attendee.role.toUpperCase()}
              </span>
            )}
          </div>
          {attendee.role_title&&<p style={{fontSize:"12px",color:"#888",margin:"2px 0 0"}}>{attendee.role_title}{attendee.organisation?` · ${attendee.organisation}`:""}</p>}
          {attendee.networking_intents?.length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginTop:"8px"}}>
              {attendee.networking_intents.map((intent:string)=>(
                <span key={intent} style={{fontSize:"10px",color:"#8A7355",background:"rgba(138,115,85,0.08)",border:"1px solid rgba(138,115,85,0.18)",borderRadius:"5px",padding:"2px 7px",fontWeight:"600"}}>{intent}</span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onConnect}
          disabled={sent}
          style={{flexShrink:0,fontSize:"11px",fontWeight:"600",color:sent?"rgba(240,237,232,0.3)":"#E26D34",background:sent?"rgba(255,255,255,0.03)":"transparent",border:sent?"1px solid rgba(255,255,255,0.06)":"1px solid rgba(226,109,52,0.35)",borderRadius:"8px",padding:"6px 12px",cursor:sent?"default":"pointer"}}
        >
          {sent?"Sent":"Connect"}
        </button>
      </div>
    </div>
  );
}
