"use client";
import{useRouter}from"next/navigation";
import OreetiLogo from"@/components/OreetiLogo";

export default function HomePage(){
  const router=useRouter();
  return(
    <main style={{minHeight:"100vh",background:"#0f0f13",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
      <div style={{marginBottom:"64px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <OreetiLogo size="lg" theme="dark"/>
      </div>

      <div style={{width:"100%",maxWidth:"320px",display:"flex",flexDirection:"column",gap:"12px"}}>
        <button onClick={()=>router.push("/login?mode=signup")} style={{width:"100%",padding:"16px",borderRadius:"16px",background:"linear-gradient(135deg,#E26D34,#c85a24)",color:"#fff",border:"none",fontSize:"15px",fontWeight:"600",cursor:"pointer",boxShadow:"0 8px 24px rgba(226,109,52,0.3)"}}>
          Host an event
        </button>
        <button onClick={()=>router.push("/login")} style={{width:"100%",padding:"16px",borderRadius:"16px",background:"transparent",color:"#f1f0f5",border:"1px solid rgba(255,255,255,0.1)",fontSize:"15px",cursor:"pointer"}}>
          Sign in
        </button>
      </div>

      <div style={{marginTop:"48px",display:"flex",gap:"20px",justifyContent:"center"}}>
        <a href="/terms" target="_blank" style={{color:"#6b6880",fontSize:"11px",textDecoration:"none"}}>Terms</a>
        <a href="/privacy" target="_blank" style={{color:"#6b6880",fontSize:"11px",textDecoration:"none"}}>Privacy</a>
      </div>
    </main>
  );
}