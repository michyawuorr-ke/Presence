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
        }
      }
      setLoading(false);
    }
    load();
  },[router]);

  async function save(){
    if(!displayName.trim()){return;}
    setSaving(true);
    const{data:{user}}=await supabase.auth.getUser();
    if(!user){return;}
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
      await supabase.from("host_profiles").insert(data);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(()=>setSaved(false),3000);
  }

  const inp={
    width:"100%",
    padding:"12px 14px",
    borderRadius:"12px",
    border:"1px solid #e5e7eb",
    fontSize:"14px",
    outline:"none",
    boxSizing:"border-box" as const,
    fontFamily:"inherit",
    marginBottom:"10px",
  };

  if(loading)return<div style={{textAlign:"center",padding:"60px",color:"#999"}}>Loading...</div>;

  return(
    <div style={{maxWidth:"600px",margin:"0 auto"}}>
      <h1 style={{fontSize:"20px",fontWeight:"600",marginBottom:"4px"}}>Your Organizer Profile</h1>
      <p style={{fontSize:"13px",color:"#999",marginBottom:"24px"}}>This is how you appear as a VIP host in your events</p>

      {/* Preview */}
      <div style={{background:"linear-gradient(135deg,#fef3c7,#fde68a)",borderRadius:"20px",padding:"20px",marginBottom:"24px",border:"1px solid #f59e0b"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"}}>
          <div style={{width:"48px",height:"48px",borderRadius:"50%",background:"#f59e0b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",fontWeight:"700",color:"#000"}}>
            {displayName?.charAt(0)?.toUpperCase()||"?"}
          </div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <p style={{fontSize:"16px",fontWeight:"600",color:"#0a0a0b"}}>{displayName||"Your Name"}</p>
              <span style={{background:"#f59e0b",color:"#000",fontSize:"10px",fontWeight:"700",padding:"2px 8px",borderRadius:"6px",letterSpacing:"0.05em"}}>HOST</span>
            </div>
            <p style={{fontSize:"13px",color:"#78350f"}}>{role||"Your role"}</p>
          </div>
        </div>
        {organisation&&<p style={{fontSize:"13px",color:"#92400e",marginBottom:"4px"}}>{organisation}</p>}
        {bio&&<p style={{fontSize:"13px",color:"#78350f",marginBottom:"4px"}}>{bio}</p>}
        {link&&<p style={{fontSize:"13px",color:"#b45309"}}>{link.replace("https://","").replace("http://","")}</p>}
        <p style={{fontSize:"11px",color:"#92400e",marginTop:"12px",fontStyle:"italic"}}>This is how guests see you in Networking</p>
      </div>

      {/* Form */}
      <div style={{background:"#fff",borderRadius:"20px",padding:"24px",border:"1px solid rgba(0,0,0,0.06)",marginBottom:"16px"}}>
        <p style={{fontSize:"12px",fontWeight:"600",color:"#999",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"16px"}}>Profile Details</p>
        <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" style={inp}/>
        <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Role (e.g. Founder, CEO, Curator)" style={inp}/>
        <input value={organisation} onChange={e=>setOrganisation(e.target.value)} placeholder="Organisation" style={inp}/>
        <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Short bio" style={{...inp,minHeight:"80px",resize:"vertical"}}/>
        <input value={link} onChange={e=>setLink(e.target.value)} placeholder="LinkedIn, website, Instagram..." style={{...inp,marginBottom:"0"}}/>
      </div>

      {/* Visibility toggle */}
      <div style={{background:"#fff",borderRadius:"20px",padding:"20px",border:"1px solid rgba(0,0,0,0.06)",marginBottom:"24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <p style={{fontSize:"14px",fontWeight:"500",marginBottom:"2px"}}>Appear in my events</p>
          <p style={{fontSize:"12px",color:"#999"}}>Show as VIP host in Networking when event is live</p>
        </div>
        <div
          onClick={()=>setShowInEvents(!showInEvents)}
          style={{width:"48px",height:"26px",borderRadius:"13px",background:showInEvents?"#f59e0b":"#e5e7eb",cursor:"pointer",position:"relative",transition:"background 0.2s"}}
        >
          <div style={{position:"absolute",top:"3px",left:showInEvents?"22px":"3px",width:"20px",height:"20px",borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
        </div>
      </div>

      {saved&&<p style={{color:"#16a34a",fontSize:"13px",textAlign:"center",marginBottom:"12px"}}>✓ Profile saved</p>}

      <button onClick={save} disabled={saving||!displayName.trim()} style={{width:"100%",padding:"14px",borderRadius:"14px",background:saving?"#e5e7eb":"#0a0a0b",color:saving?"#999":"#fff",border:"none",fontSize:"14px",fontWeight:"600",cursor:saving?"not-allowed":"pointer"}}>
        {saving?"Saving...":"Save Profile"}
      </button>
    </div>
  );
}
