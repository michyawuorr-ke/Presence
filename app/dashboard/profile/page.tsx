"use client";
import{useEffect,useState}from"react";
import{useRouter}from"next/navigation";
import{supabase}from"@/lib/supabase/client";

export default function HostProfilePage(){
  const[host,setHost]=useState<any>(null);
  const[profile,setProfile]=useState<any>(null);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[editing,setEditing]=useState(false);
  const[displayName,setDisplayName]=useState("");
  const[role,setRole]=useState("");
  const[organisation,setOrganisation]=useState("");
  const[bio,setBio]=useState("");
  const[link,setLink]=useState("");
  const[showInEvents,setShowInEvents]=useState(true);
  const router=useRouter();

  useEffect(()=>{
    async function load(){
      const{data:{user}}=await supabase.auth.getUser();
      if(!user){router.push("/login");return;}
      const{data:h}=await supabase.from("hosts").select("*").eq("email",user.email).single();
      setHost(h);
      if(h){
        const{data:p}=await supabase.from("host_profiles").select("*").eq("host_id",h.id).single();
        if(p){
          setProfile(p);
          setDisplayName(p.display_name||h?.name||"");
          setRole(p.role_title||"");
          setOrganisation(p.organisation||"");
          setBio(p.bio||"");
          setLink(p.platform_value||"");
          setShowInEvents(p.show_in_events??true);
        }else{
          setDisplayName(h?.name||"");
          setEditing(true);
        }
      }
      setLoading(false);
    }
    load();
  },[router]);

  async function save(){
    if(!displayName.trim())return;
    setSaving(true);
    const{data:{user}}=await supabase.auth.getUser();
    if(!user){setSaving(false);return;}
    const{data:h}=await supabase.from("hosts").select("id").eq("email",user.email).single();
    if(!h){setSaving(false);return;}
    const data={
      host_id:h.id,
      display_name:displayName,
      role_title:role,
      organisation,
      bio,
      platform_value:link,
      show_in_events:showInEvents,
      updated_at:new Date().toISOString(),
    };
    if(profile){
      await supabase.from("host_profiles").update(data).eq("id",profile.id);
    }else{
      const{data:newP}=await supabase.from("host_profiles").insert(data).select().single();
      setProfile(newP);
    }
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(()=>setSaved(false),3000);
  }

  const inp={
    width:"100%",
    padding:"12px 14px",
    borderRadius:"10px",
    border:"1px solid rgba(255,255,255,0.1)",
    background:"rgba(255,255,255,0.05)",
    color:"#ffffff",
    fontSize:"14px",
    outline:"none",
    boxSizing:"border-box" as const,
    fontFamily:"inherit",
    marginBottom:"10px",
  };

  if(loading)return<div style={{textAlign:"center",padding:"60px",color:"rgba(255,255,255,0.4)"}}>Loading...</div>;

  const hasProfile=profile&&displayName;

  return(
    <div style={{maxWidth:"500px",margin:"0 auto"}}>

      {/* Profile card — shown when filled */}
      {hasProfile&&!editing&&(
        <div style={{background:"rgba(212,175,55,0.08)",borderRadius:"20px",padding:"20px",marginBottom:"16px",border:"1px solid rgba(212,175,55,0.3)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"12px"}}>
            <div style={{width:"48px",height:"48px",borderRadius:"50%",background:"linear-gradient(135deg,#D4AF37,#b8962e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",fontWeight:"700",color:"#000",flexShrink:0}}>
              {displayName?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"2px"}}>
                <p style={{fontSize:"16px",fontWeight:"700",color:"#ffffff"}}>{displayName}</p>
                <span style={{background:"rgba(212,175,55,0.2)",color:"#D4AF37",fontSize:"10px",fontWeight:"700",padding:"2px 8px",borderRadius:"6px",letterSpacing:"0.05em"}}>HOST</span>
              </div>
              {role&&<p style={{fontSize:"13px",color:"rgba(255,255,255,0.6)"}}>{role}</p>}
              {organisation&&<p style={{fontSize:"13px",color:"rgba(255,255,255,0.5)"}}>{organisation}</p>}
            </div>
          </div>
          {bio&&<p style={{fontSize:"13px",color:"rgba(255,255,255,0.5)",marginBottom:"8px",lineHeight:"1.5"}}>{bio}</p>}
          {link&&<p style={{fontSize:"13px",color:"#D4AF37"}}>{link.replace("https://","").replace("http://","")}</p>}
          <button onClick={()=>setEditing(true)} style={{width:"100%",marginTop:"16px",padding:"10px",borderRadius:"10px",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.08)",fontSize:"13px",cursor:"pointer",fontWeight:"500"}}>
            Edit Profile
          </button>
        </div>
      )}

      {/* Visibility toggle — always visible */}
      {hasProfile&&!editing&&(
        <div style={{background:"rgba(26,26,36,0.9)",borderRadius:"16px",padding:"16px",marginBottom:"16px",border:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{fontSize:"14px",color:"#ffffff",fontWeight:"500"}}>Appear in my events</p>
          <div onClick={()=>{setShowInEvents(!showInEvents);}} style={{width:"44px",height:"24px",borderRadius:"12px",background:showInEvents?"#D4AF37":"rgba(255,255,255,0.1)",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
            <div style={{position:"absolute",top:"3px",left:showInEvents?"22px":"3px",width:"18px",height:"18px",borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
          </div>
        </div>
      )}

      {/* Edit form — shown when editing or no profile yet */}
      {editing&&(
        <div style={{background:"rgba(26,26,36,0.9)",borderRadius:"20px",padding:"20px",marginBottom:"16px",border:"1px solid rgba(255,255,255,0.06)"}}>
          <p style={{fontSize:"11px",fontWeight:"600",color:"rgba(255,255,255,0.4)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"16px"}}>
            {hasProfile?"Edit Profile":"Set up your host profile"}
          </p>
          <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" style={inp}/>
          <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Role — Founder, Curator, CEO..." style={inp}/>
          <input value={organisation} onChange={e=>setOrganisation(e.target.value)} placeholder="Organisation" style={inp}/>
          <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Short bio" style={{...inp,minHeight:"72px",resize:"vertical"}}/>
          <input value={link} onChange={e=>setLink(e.target.value)} placeholder="LinkedIn, website, Instagram..." style={{...inp,marginBottom:"16px"}}/>

          <div style={{display:"flex",gap:"8px"}}>
            {hasProfile&&<button onClick={()=>setEditing(false)} style={{flex:1,padding:"12px",borderRadius:"10px",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.08)",fontSize:"13px",cursor:"pointer"}}>Cancel</button>}
            <button onClick={save} disabled={saving||!displayName.trim()} style={{flex:2,padding:"12px",borderRadius:"10px",background:saving?"rgba(255,255,255,0.1)":"linear-gradient(135deg,#D4AF37,#b8962e)",color:"#fff",border:"none",fontSize:"14px",fontWeight:"600",cursor:saving?"not-allowed":"pointer"}}>
              {saving?"Saving...":"Save Profile"}
            </button>
          </div>
        </div>
      )}

      {saved&&<p style={{color:"#D4AF37",fontSize:"13px",textAlign:"center",marginTop:"8px"}}>✓ Profile saved</p>}
    </div>
  );
}
