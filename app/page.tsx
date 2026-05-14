"use client";
import{useRouter}from"next/navigation";

export default function HomePage(){
  const router=useRouter();
  return(
    <main style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
      <div style={{marginBottom:"64px",textAlign:"center"}}>
        <p style={{fontSize:"11px",letterSpacing:"0.4em",color:"#444",textTransform:"uppercase",marginBottom:"24px"}}>Welcome to</p>
        <h1 style={{fontSize:"48px",fontWeight:"700",color:"#fff",letterSpacing:"-0.03em",lineHeight:"1",marginBottom:"12px"}}>Oreeti</h1>
        <p style={{fontSize:"16px",color:"#555",fontWeight:"300",letterSpacing:"0.02em"}}>Your Events, Alive.</p>
      </div>

      <div style={{width:"100%",maxWidth:"320px",display:"flex",flexDirection:"column",gap:"12px"}}>
        <button onClick={()=>router.push("/login?mode=signup")} style={{width:"100%",padding:"16px",borderRadius:"16px",background:"#fff",color:"#000",border:"none",fontSize:"15px",fontWeight:"600",cursor:"pointer"}}>
          Host an event
        </button>
        <button onClick={()=>router.push("/login")} style={{width:"100%",padding:"16px",borderRadius:"16px",background:"transparent",color:"#fff",border:"1px solid #222",fontSize:"15px",cursor:"pointer"}}>
          Sign in
        </button>
      </div>

      <p style={{color:"#333",fontSize:"11px",marginTop:"48px",textAlign:"center"}}>
        The simplest way to connect at real-world events.
      </p>
    </main>
  );
}
