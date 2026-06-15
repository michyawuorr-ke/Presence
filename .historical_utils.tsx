"use client";
import{useEffect,useState,useRef,useCallback}from"react";
import{useParams}from"next/navigation";
import{supabase}from"@/lib/supabase/client";
import QRCode from"qrcode";
import OreetiLogo from"@/components/OreetiLogo";

type Screen="splash"|"identity"|"scene";
type Tab="scene"|"networking"|"ticket"|"profile";

function cleanUrl(url:string){
  if(!url)return"";
  return url.replace("https://","").replace("http://","").replace("www.","");
}

function copyToClipboard(text:string){
  const el=document.createElement("textarea");
  el.value=text;
  el.style.position="fixed";
  el.style.opacity="0";
  document.body.appendChild(el);
  el.focus();
  el.select();
  try{document.execCommand("copy");}catch(e){}
  document.body.removeChild(el);
}

function getFirstName(name:string){
  if(!name)return"";
  return name.split(" ")[0];
}

function generatePositions(count:number){
  const zones=[
    {x:15,y:20},{x:75,y:15},{x:85,y:45},{x:70,y:75},
    {x:30,y:80},{x:10,y:55},{x:50,y:25},{x:45,y:65},
  ];
  return zones.slice(0,count).map(z=>({
    x:z.x+(Math.random()*10-5),
    y:z.y+(Math.random()*10-5),
  }));
}

export default function GuestEntryPage(){
  const[screen,setScreen]=useState<Screen>("splash");
  const[registration,setRegistration]=useState<any>(null);
  const[profile,setProfile]=useState<any>(null);
  const[event,setEvent]=useState<any>(null);
  const[loading,setLoading]=useState(true);
  const params=useParams();
  const token=params.token as string;
  const slug=params.slug as string;

  useEffect(()=>{
    async function load(){
      const{data:reg}=await supabase.from("registrations").select("*").eq("access_token",token).single();
      setRegistration(reg);
      const{data:ev}=await supabase.from("events").select("*").eq("id",reg.event_id).single();
      setEvent(ev);
      const{data:prof}=await supabase.from("guest_profiles").select("*").eq("registration_id",reg.id).single();
      if(prof){
        setProfile(prof);
      }else if(reg?.status==="host"){
        const{data:evFull}=await supabase.from("events").select("host_id").eq("id",reg.event_id).single();
        if(evFull){
          const{data:h}=await supabase.from("hosts").select("*").eq("id",evFull.host_id).single();
          if(h){
            const{data:hp}=await supabase.from("host_profiles").select("*").eq("host_id",h.id).single();
            const name=hp?.display_name||h.name||"Host";
            // Try insert — if exists, fetch and update instead
            const{data:newProf,error:insertErr}=await supabase.from("guest_profiles").insert({
              registration_id:reg.id,
              event_id:reg.event_id,
              display_name:name,
              role_title:hp?.role_title||"",
              organisation:hp?.organisation||"",
              bio:hp?.bio||"",
              platform_type:"link",
              platform_value:hp?.platform_value||"",
              aura_active:false,
            }).select().single();
            if(newProf){
              setProfile(newProf);
            }else{
              // Profile exists — fetch and update with latest host_profile data
              const{data:existing}=await supabase.from("guest_profiles").select("*").eq("registration_id",reg.id).single();
              if(existing){
                const{data:updated}=await supabase.from("guest_profiles").update({
                  display_name:name,
                  role_title:hp?.role_title||"",
                  organisation:hp?.organisation||"",
                  bio:hp?.bio||"",
                  platform_value:hp?.platform_value||"",
                }).eq("registration_id",reg.id).select().single();
                setProfile(updated||existing);
              }
            }
          }
        }
      }
      setLoading(false);
    }
    load();
  },[token]);

  useEffect(()=>{
    if(loading)return;
    const timer=setTimeout(()=>{
      if(profile)setScreen("scene");
      else if(registration?.status==="host")setScreen("scene");
      else setScreen("identity");
    },2200);
    return()=>clearTimeout(timer);
  },[loading,profile]);

  if(screen==="splash")return<Splash/>;
  if(screen==="identity")return<Identity registration={registration} event={event} onComplete={(p:any)=>{setProfile(p);setScreen("scene");}}/>;
  return<Scene event={event} registration={registration} profile={profile} onProfileUpdate={setProfile}/>;
}

