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
            setError("Scanned ID: "+regId);
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

  if(loading)return<div style={{minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:"#666"}}>Loading...</p></div>;

  return(
    <div style={{minHeight:"100vh",background:"#0a0a0b",padding:"24px 20px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:"16px",marginBottom:"32px"}}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"#666",fontSize:"20px",cursor:"pointer",padding:"0"}}>←</button>
        <div>
          <p style={{fontSize:"11px",letterSpacing:"0.2em",color:"#666",textTransform:"uppercase"}}>Gate Scanner</p>
          <p style={{fontSize:"16px",fontWeight:"500",color:"#fff"}}>{event?.title}</p>
        </div>
      </div>

      {/* Checkin count */}
      <div style={{background:"#111",borderRadius:"20px",padding:"20px",marginBottom:"24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <p style={{fontSize:"36px",fontWeight:"700",color:"#4ade80",lineHeight:"1",marginBottom:"4px"}}>{checkinCount}</p>
          <p style={{fontSize:"13px",color:"#666"}}>checked in</p>
        </div>
        <p style={{fontSize:"32px"}}>🎟</p>
      </div>

      {/* Scanner area */}
      {!scanning&&!result&&(
        <div style={{textAlign:"center"}}>
          <div style={{background:"#111",borderRadius:"24px",padding:"40px 24px",marginBottom:"24px"}}>
            <p style={{fontSize:"48px",marginBottom:"16px"}}>📷</p>
            <p style={{fontSize:"16px",color:"#fff",fontWeight:"500",marginBottom:"8px"}}>Ready to scan</p>
            <p style={{fontSize:"13px",color:"#666",marginBottom:"32px"}}>Tap below to open camera and scan guest Entry QR</p>
            <button onClick={startScanner} style={{width:"100%",padding:"18px",borderRadius:"16px",background:"#fff",color:"#000",border:"none",fontSize:"16px",fontWeight:"600",cursor:"pointer"}}>
              Open Camera
            </button>
          </div>
          {error&&<p style={{color:"#ef4444",fontSize:"14px"}}>{error}</p>}
        </div>
      )}

      {/* Camera view */}
      {scanning&&(
        <div style={{textAlign:"center"}}>
          <p style={{color:"#999",fontSize:"13px",marginBottom:"16px"}}>Point at guest's Entry QR in their Ticket tab</p>
          <div style={{position:"relative",width:"100%",maxWidth:"320px",margin:"0 auto 24px"}}>
            <div id="host-qr-reader" style={{width:"100%",borderRadius:"16px",overflow:"hidden",background:"#111"}}></div>
            <div style={{position:"absolute",inset:0,border:"2px solid #2563eb",borderRadius:"16px",pointerEvents:"none"}}/>
          </div>
          <button onClick={stopScanner} style={{padding:"12px 32px",background:"transparent",border:"1px solid #333",borderRadius:"14px",color:"#666",fontSize:"14px",cursor:"pointer"}}>Cancel</button>
        </div>
      )}

      {/* Result */}
      {result&&(
        <div style={{textAlign:"center"}}>
          <div style={{background:result.success?"#052e16":result.already?"#1c1f2e":"#2d0a0a",borderRadius:"24px",padding:"40px 24px",marginBottom:"24px",border:"1px solid "+(result.success?"#16a34a":result.already?"#2563eb":"#ef4444")}}>
            <p style={{fontSize:"56px",marginBottom:"16px"}}>{result.success?"✓":result.already?"↩":"✗"}</p>
            <p style={{fontSize:"24px",fontWeight:"600",color:result.success?"#4ade80":result.already?"#60a5fa":"#f87171",marginBottom:"8px"}}>{result.message}</p>
            {result.name&&<p style={{fontSize:"18px",color:"#fff",marginBottom:"4px"}}>{result.name}</p>}
            {result.already&&result.time&&<p style={{fontSize:"13px",color:"#666"}}>Checked in at {new Date(result.time).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})}</p>}
          </div>
          <button onClick={scanNext} style={{width:"100%",padding:"18px",borderRadius:"16px",background:"#fff",color:"#000",border:"none",fontSize:"16px",fontWeight:"600",cursor:"pointer"}}>
            Scan Next Guest →
          </button>
        </div>
      )}
    </div>
  );
}
