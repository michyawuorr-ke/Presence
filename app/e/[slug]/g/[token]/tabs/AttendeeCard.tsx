"use client";

interface AttendeeCardProps {
  attendee: any;
  sent: boolean;
  onConnect: () => void;
  live?: boolean;
}

export default function AttendeeCard({ attendee, sent, onConnect, live }: AttendeeCardProps) {
  return(
    <div style={{background:"#1C1C1E",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
            {live&&<span style={{width:"7px",height:"7px",borderRadius:"50%",background:"#4ade80",display:"inline-block",animation:"pulse 2s infinite",flexShrink:0}}/>}
            <p style={{fontSize:"14px",fontWeight:"600",color:"#f1f0f5",margin:0}}>{attendee.display_name}</p>
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
