"use client";
import{useEffect,useState,useRef}from"react";
import{useParams,useRouter}from"next/navigation";
import{supabase}from"@/lib/supabase/client";

export default function ScannerPage(){
  const[event,setEvent]=useState<any>(null);
  const[scanning,setScanning]=useState(false);
  const[result,setResult]=useState<any>(null);
  const[error,setError]=useState("");
  const[loading,setLoading]=useState(true);
  const[checkinCount,setCheckinCount]=useState(0);
  const scannerRef=useRef<any>(null);
  const params=useParams();
  const router=useRouter();
  const eventId=params.eventId as string;

  useEffect(()=>{
    async function load(){
      const{data:{user}}=await supabase.auth.getUser();
      if(!user){router.push("/login");return;}
      const{data:ev}=await supabase.from("events").select("*").eq("id",eventId).single();
      setEvent(ev);
      const{count}=await supabase.from("registrations").select("*",{count:"exact",head:true}).eq("event_id",eventId).eq("checked_in",true);
      setCheckinCount(count||0);
      setLoading(false);
    }
    load();
  },[eventId]);

  async function startScanner(){
    setScanning(true);
    setResult(null);
    setError("");
    await new Promise(r=>setTimeout(r,500));
    const{Html5Qrcode}=await import("html5-qrcode");
    const scanner=new Html5Qrcode("host-qr-reader");
    scannerRef.current=scanner;
    try{
      await scanner.start(
        {facingMode:"environment"},
        {fps:10,qrbox:{width:250,height:250}},
        async(decoded:string)=>{
          if(decoded.startsWith("presence:entry:")){
            const regId=decoded.replace("presence:entry:","");
            await scanner.stop();
            setScanning(false);
            await handleCheckin(regId);
          }
        },
        ()=>{}
      );
    }catch(err){
      setScanning(false);
      setError("Camera not available. Check permissions.");
    }
  }

  async function handleCheckin(regId:string){
    const{data:reg}=await supabase.from("registrations").select("*").eq("id",regId).single();
    if(!reg){
      setResult({success:false,message:"Invalid ticket"});
      return;
    }
    if(reg.event_id!==eventId){
      setResult({success:false,message:"Ticket is for a different event"});
      return;
    }
    if(reg.checked_in){
      setResult({success:false,already:true,message:"Already checked in",name:reg.guest_name,time:reg.checked_in_at});
      return;
    }
    // Mark checked in
    const{error:err}=await supabase.from("registrations").update({checked_in:true,checked_in_at:new Date().toISOString()}).eq("id",regId);
    if(err){
      setResult({success:false,message:"Check-in failed: "+err.message});
      return;
    }
    setCheckinCount(prev=>prev+1);
    setResult({success:true,message:"Welcome!",name:reg.guest_name,ticket:reg.ticket_type_id});
  }

  function stopScanner(){
    scannerRef.current?.stop().catch(()=>{});
    setScanning(false);
  }

  function scanNext(){
    setResult(null);
    setError("");
    startScanner();
  }

  if(loading)return(
    <div style={{minHeight:"100vh",background:"#0f0f13",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"#6b6880",fontSize:"13px"}}>Loading...</p>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:"#0f0f13",padding:"24px 20px",fontFamily:"var(--font-inter),-apple-system,sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"32px"}}>
        <button onClick={()=>router.back()} style={{background:"rgba(255,255,255,0.06)",border:"none",color:"#f1f0f5",fontSize:"16px",cursor:"pointer",width:"36px",height:"36px",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
        <div>
          <p style={{fontSize:"15px",fontWeight:"600",color:"#f1f0f5"}}>{event?.title}</p>
          <p style={{fontSize:"11px",color:"#6b6880",letterSpacing:"0.05em",textTransform:"uppercase"}}>Gate Scanner</p>
        </div>
      </div>

      <div style={{background:"linear-gradient(135deg,rgba(124,106,255,0.15),rgba(124,106,255,0.05))",borderRadius:"20px",padding:"20px",marginBottom:"24px",border:"1px solid rgba(124,106,255,0.2)"}}>
        <p style={{fontSize:"40px",fontWeight:"700",color:"#7c6aff",lineHeight:"1",marginBottom:"4px"}}>{checkinCount}</p>
        <p style={{fontSize:"13px",color:"#6b6880"}}>checked in</p>
      </div>

      {!scanning&&!result&&(
        <div>
          <button onClick={startScanner} style={{width:"100%",padding:"18px",borderRadius:"16px",background:"linear-gradient(135deg,#7c6aff,#5b4fd4)",color:"#fff",border:"none",fontSize:"15px",fontWeight:"600",cursor:"pointer",boxShadow:"0 8px 24px rgba(124,106,255,0.3)"}}>
            Open Camera
          </button>
          {error&&<p style={{color:"#f87171",fontSize:"13px",textAlign:"center",marginTop:"16px"}}>{error}</p>}
        </div>
      )}

      {scanning&&(
        <div style={{textAlign:"center"}}>
          <div style={{position:"relative",width:"100%",maxWidth:"320px",margin:"0 auto 24px"}}>
            <div id="host-qr-reader" style={{width:"100%",borderRadius:"16px",overflow:"hidden",background:"#1a1a24"}}></div>
            <div style={{position:"absolute",inset:0,border:"2px solid #7c6aff",borderRadius:"16px",pointerEvents:"none"}}/>
          </div>
          <button onClick={stopScanner} style={{padding:"12px 32px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",color:"#6b6880",fontSize:"14px",cursor:"pointer"}}>Cancel</button>
        </div>
      )}

      {result&&(
        <div style={{textAlign:"center"}}>
          <div style={{background:result.success?"rgba(52,211,153,0.1)":result.already?"rgba(124,106,255,0.1)":"rgba(248,113,113,0.1)",borderRadius:"24px",padding:"40px 24px",marginBottom:"24px",border:"1px solid "+(result.success?"rgba(52,211,153,0.3)":result.already?"rgba(124,106,255,0.3)":"rgba(248,113,113,0.3)")}}>
            <p style={{fontSize:"48px",marginBottom:"16px"}}>{result.success?"✓":result.already?"↩":"✗"}</p>
            <p style={{fontSize:"22px",fontWeight:"600",color:result.success?"#34d399":result.already?"#7c6aff":"#f87171",marginBottom:"8px"}}>{result.message}</p>
            {result.name&&<p style={{fontSize:"16px",color:"#f1f0f5"}}>{result.name}</p>}
            {result.already&&result.time&&<p style={{fontSize:"12px",color:"#6b6880",marginTop:"8px"}}>{new Date(result.time).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})}</p>}
          </div>
          <button onClick={scanNext} style={{width:"100%",padding:"16px",borderRadius:"16px",background:"linear-gradient(135deg,#7c6aff,#5b4fd4)",color:"#fff",border:"none",fontSize:"15px",fontWeight:"600",cursor:"pointer"}}>
            Scan Next →
          </button>
        </div>
      )}
    </div>
  );
}