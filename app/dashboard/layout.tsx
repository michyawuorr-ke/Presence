"use client";
import{usePathname,useRouter}from"next/navigation";
import{useEffect}from"react";
import{supabase}from"@/lib/supabase/client";
import OreetiLogo from"@/components/OreetiLogo";

const tabs=[
  {label:"Events",path:"/dashboard/events"},
  {label:"Profile",path:"/dashboard/profile"},
];

export default function DashboardLayout({children}:{children:React.ReactNode}){
  const pathname=usePathname();
  const router=useRouter();

  useEffect(()=>{
    supabase.auth.getUser().then(({data:{user}})=>{
      if(!user)router.push("/login");
    });
  },[router]);

  return(
    <div style={{minHeight:"100vh",background:"#0f0f13",fontFamily:"var(--font-inter),-apple-system,sans-serif"}}>
      <div style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:"rgba(15,15,19,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"0 20px",maxWidth:"480px",margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:"52px"}}>
          <p style={{fontSize:"18px",fontWeight:"700",color:"#ffffff",letterSpacing:"-0.02em",fontFamily:"'Helvetica Neue',Arial,sans-serif"}}>
            <span style={{color:"#ffffff"}}>Or</span><span style={{color:"#E26D34"}}>ee</span><span style={{color:"#ffffff"}}>ti</span>
          </p>
          <button onClick={async()=>{await supabase.auth.signOut();router.push("/login");}} style={{fontSize:"12px",color:"rgba(255,255,255,0.45)",background:"rgba(255,255,255,0.06)",border:"none",cursor:"pointer",padding:"6px 12px",borderRadius:"8px"}}>Sign out</button>
        </div>
        <div style={{display:"flex",gap:"4px",paddingBottom:"10px"}}>
          {tabs.map((tab)=>{
            const active=pathname.startsWith(tab.path);
            return(
              <button key={tab.path} onClick={()=>router.push(tab.path)} style={{padding:"6px 16px",borderRadius:"10px",border:"none",background:active?"rgba(226,109,52,0.12)":"transparent",color:active?"#E26D34":"rgba(255,255,255,0.45)",fontSize:"13px",fontWeight:active?"600":"400",cursor:"pointer",transition:"all 0.2s"}}>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{paddingTop:"108px",padding:"108px 16px 40px"}}>
        {children}
      </div>
    </div>
  );
}
