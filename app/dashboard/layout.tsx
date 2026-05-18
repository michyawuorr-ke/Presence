"use client";
import{usePathname,useRouter}from"next/navigation";
import{useEffect}from"react";
import{supabase}from"@/lib/supabase/client";

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
    <div style={{minHeight:"100vh",background:"var(--bg-base)",fontFamily:"var(--font-inter)"}}>
      {/* Top nav — frosted glass with depth */}
      <div style={{
        position:"fixed",top:0,left:0,right:0,zIndex:100,
        background:"rgba(10,10,12,0.88)",
        backdropFilter:"blur(24px)",
        WebkitBackdropFilter:"blur(24px)",
        borderBottom:"1px solid var(--border-subtle)",
        boxShadow:"0 1px 0 rgba(255,255,255,0.03), 0 4px 16px rgba(0,0,0,0.3)",
        padding:"0 20px",maxWidth:"480px",margin:"0 auto"
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:"54px"}}>
          {/* Wordmark — unchanged */}
          <p style={{fontSize:"19px",fontWeight:"700",letterSpacing:"-0.03em",fontFamily:"'Helvetica Neue',Arial,sans-serif",margin:0}}>
            <span style={{color:"#ffffff"}}>Or</span><span style={{color:"#E26D34"}}>ee</span><span style={{color:"#ffffff"}}>ti</span>
          </p>
          <button
            onClick={async()=>{await supabase.auth.signOut();router.push("/login");}}
            style={{fontSize:"11px",color:"var(--text-tertiary)",background:"rgba(255,255,255,0.05)",border:"1px solid var(--border-subtle)",cursor:"pointer",padding:"5px 12px",borderRadius:"8px",letterSpacing:"0.02em",transition:"all 0.2s"}}
          >Sign out</button>
        </div>
        {/* Tab bar */}
        <div style={{display:"flex",gap:"2px",paddingBottom:"10px"}}>
          {tabs.map((tab)=>{
            const active=pathname.startsWith(tab.path);
            return(
              <button key={tab.path} onClick={()=>router.push(tab.path)} style={{
                padding:"7px 18px",borderRadius:"10px",border:"none",
                background:active?"rgba(226,109,52,0.1)":"transparent",
                color:active?"#E26D34":"var(--text-tertiary)",
                fontSize:"13px",fontWeight:active?"600":"400",
                cursor:"pointer",transition:"all 0.15s",
                boxShadow:active?"inset 0 0 0 1px rgba(226,109,52,0.15)":"none",
              }}>{tab.label}</button>
            );
          })}
        </div>
      </div>
      <div style={{paddingTop:"112px",padding:"112px 16px 48px"}}>
        {children}
      </div>
    </div>
  );
}
