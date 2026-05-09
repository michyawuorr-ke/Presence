"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Screen = "splash" | "identity" | "scene";

export default function GuestEntryPage() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [registration, setRegistration] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const token = params.token as string;
  const slug = params.slug as string;

  // Splash: always shows for 2.2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) return;
      if (profile) {
        setScreen("scene");
      } else {
        setScreen("identity");
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [loading, profile]);

  useEffect(() => {
    async function load() {
      const { data: reg } = await supabase
        .from("registrations")
        .select("*")
        .eq("access_token", token)
        .single();
      if (!reg) { setLoading(false); return; }
      setRegistration(reg);

      const { data: ev } = await supabase
        .from("events")
        .select("*")
        .eq("id", reg.event_id)
        .single();
      setEvent(ev);

      const { data: prof } = await supabase
        .from("guest_profiles")
        .select("*")
        .eq("registration_id", reg.id)
        .single();
      if (prof) setProfile(prof);

      setLoading(false);
    }
    load();
  }, [token]);

  if (screen === "splash") {
    return <SplashScreen />;
  }

  if (screen === "identity") {
    return <IdentitySetup registration={registration} event={event} onComplete={(p: any) => { setProfile(p); setScreen("scene"); }} />;
  }

  return <GuestScene event={event} registration={registration} profile={profile} onProfileUpdate={setProfile} />;
}

function SplashScreen() {
  return (
    <div style={{
      position:"fixed",inset:0,background:"#000",
      display:"flex",alignItems:"center",justifyContent:"center",
      zIndex:9999,
    }}>
      <div style={{
        background:"radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%)",
        position:"absolute",inset:0,
      }} />
      <p style={{
        color:"#fff",
        fontSize:"18px",
        fontWeight:"300",
        letterSpacing:"0.25em",
        textTransform:"uppercase",
        animation:"fadeIn 1.4s ease forwards",
      }}>
        Presence Manifested
      </p>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; letter-spacing: 0.1em; }
          to { opacity: 1; letter-spacing: 0.25em; }
        }
      `}</style>
    </div>
  );
}

function IdentitySetup({ registration, event, onComplete }: any) {
  const [mode, setMode] = useState<"professional"|"creative">("professional");
  const [displayName, setDisplayName] = useState(registration?.guest_name ?? "");
  const [roleTitle, setRoleTitle] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [bio, setBio] = useState("");
  const [platformType, setPlatformType] = useState("linkedin");
  const [platformValue, setPlatformValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isPro = mode === "professional";

  async function handleSave() {
    if (!displayName) { setError("Please enter your name"); return; }
    if (!platformValue) { setError("Please add your LinkedIn, Gmail, TikTok or Instagram"); return; }
    setSaving(true);
    const { data, error: err } = await supabase.from("guest_profiles").insert({
      registration_id: registration.id,
      event_id: registration.event_id,
      identity_mode: mode,
      display_name: displayName,
      role_title: roleTitle,
      organisation,
      bio,
      platform_type: platformType,
      platform_value: platformValue,
    }).select().single();
    if (err) { setError(err.message); setSaving(false); return; }
    onComplete(data);
  }

  const platformOptions = isPro
    ? [{ value: "linkedin", label: "LinkedIn" }, { value: "gmail", label: "Gmail" }]
    : [{ value: "tiktok", label: "TikTok" }, { value: "instagram", label: "Instagram" }];

  const inputStyle = {
    width:"100%", padding:"14px", borderRadius:"14px",
    border:"1px solid #222", background:"#111", color:"#fff",
    fontSize:"15px", outline:"none", marginBottom:"12px",
    boxSizing:"border-box" as const,
  };

  return (
    <div style={{minHeight:"100vh",background:"#000",padding:"40px 24px"}}>
      <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#666",textTransform:"uppercase",marginBottom:"32px",textAlign:"center"}}>
        Presence
      </p>
      <h1 style={{fontSize:"24px",fontWeight:"300",color:"#fff",marginBottom:"8px",textAlign:"center"}}>
        Who are you here as?
      </h1>
      <p style={{color:"#555",textAlign:"center",marginBottom:"32px",fontSize:"14px"}}>
        {event?.title}
      </p>

      {/* Mode toggle */}
      <div style={{display:"flex",gap:"8px",marginBottom:"32px",background:"#111",borderRadius:"16px",padding:"4px"}}>
        <button onClick={() => { setMode("professional"); setPlatformType("linkedin"); }}
          style={{flex:1,padding:"12px",borderRadius:"12px",border:"none",cursor:"pointer",
            background: isPro ? "#2563eb" : "transparent",
            color: isPro ? "#fff" : "#666", fontSize:"14px", fontWeight:"500", transition:"all 0.2s"}}>
          Professional
        </button>
        <button onClick={() => { setMode("creative"); setPlatformType("tiktok"); }}
          style={{flex:1,padding:"12px",borderRadius:"12px",border:"none",cursor:"pointer",
            background: !isPro ? "#7c3aed" : "transparent",
            color: !isPro ? "#fff" : "#666", fontSize:"14px", fontWeight:"500", transition:"all 0.2s"}}>
          Creative
        </button>
      </div>

      <input value={displayName} onChange={e => setDisplayName(e.target.value)}
        placeholder="Your name" style={inputStyle} />
      <input value={roleTitle} onChange={e => setRoleTitle(e.target.value)}
        placeholder={isPro ? "Job title (e.g. Product Manager)" : "Creative role (e.g. Filmmaker)"}
        style={inputStyle} />
      <input value={organisation} onChange={e => setOrganisation(e.target.value)}
        placeholder={isPro ? "Company / Organisation" : "Studio / Collective (optional)"}
        style={inputStyle} />
      <input value={bio} onChange={e => setBio(e.target.value)}
        placeholder={isPro ? "Short bio" : "Your vibe"}
        style={inputStyle} />

      <div style={{marginBottom:"12px"}}>
        <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
          {platformOptions.map(p => (
            <button key={p.value} onClick={() => setPlatformType(p.value)}
              style={{flex:1,padding:"10px",borderRadius:"12px",border:"1px solid " + (platformType === p.value ? "#fff" : "#222"),
                background:"transparent",color: platformType === p.value ? "#fff" : "#666",fontSize:"13px",cursor:"pointer"}}>
              {p.label}
            </button>
          ))}
        </div>
        <input value={platformValue} onChange={e => setPlatformValue(e.target.value)}
          placeholder={platformType === "linkedin" ? "LinkedIn URL" : platformType === "gmail" ? "Gmail address" : platformType === "tiktok" ? "TikTok handle" : "Instagram handle"}
          style={inputStyle} />
      </div>

      {error && <p style={{color:"#ef4444",fontSize:"13px",marginBottom:"12px"}}>{error}</p>}

      <button onClick={handleSave} disabled={saving}
        style={{width:"100%",padding:"16px",borderRadius:"16px",
          background: saving ? "#333" : isPro ? "#2563eb" : "#7c3aed",
          color:"#fff",border:"none",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>
        {saving ? "Saving..." : "Enter the scene →"}
      </button>
    </div>
  );
}

function GuestScene({ event, registration, profile, onProfileUpdate }: any) {
  const [tab, setTab] = useState("scene");
  const [countdown, setCountdown] = useState({ days:0, hours:0, minutes:0, seconds:0, isOver:false });
  const [auraCount, setAuraCount] = useState(0);
  const [handshakeCount, setHandshakeCount] = useState(0);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [fiveMinWarning, setFiveMinWarning] = useState(false);

  useEffect(() => {
    if (!event) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(event.start_time).getTime();
      const end = new Date(event.end_time).getTime();
      const diff = start - now;
      const timeToEnd = end - now;

      setIsLive(now >= start && now < end);
      setIsEnded(now >= end);
      setFiveMinWarning(timeToEnd > 0 && timeToEnd <= 5 * 60 * 1000);

      if (diff <= 0) {
        setCountdown({ days:0, hours:0, minutes:0, seconds:0, isOver:true });
      } else {
        setCountdown({
          days: Math.floor(diff / (1000*60*60*24)),
          hours: Math.floor((diff % (1000*60*60*24)) / (1000*60*60)),
          minutes: Math.floor((diff % (1000*60*60)) / (1000*60)),
          seconds: Math.floor((diff % (1000*60)) / 1000),
          isOver: false,
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [event]);

  useEffect(() => {
    async function loadStats() {
      if (!event) return;
      const [aura, shakes, msgs] = await Promise.all([
        supabase.from("guest_profiles").select("id", {count:"exact"}).eq("event_id", event.id).eq("aura_active", true),
        supabase.from("handshakes").select("id", {count:"exact"}).eq("event_id", event.id),
        supabase.from("broadcast_messages").select("*").eq("event_id", event.id).order("sent_at", {ascending:false}).limit(5),
      ]);
      setAuraCount(aura.count ?? 0);
      setHandshakeCount(shakes.count ?? 0);
      setBroadcasts(msgs.data ?? []);
    }
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, [event]);

  const navItems = [
    { id:"scene", label:"Scene", emoji:"✦" },
    { id:"aura", label:"Aura", emoji:"◎" },
    { id:"ticket", label:"Ticket", emoji:"🎟" },
    { id:"profile", label:"Profile", emoji:"◐" },
    { id:"archive", label:"Archive", emoji:"◇" },
  ];

  const isPro = profile?.identity_mode === "professional";
  const accentColor = isPro ? "#2563eb" : "#7c3aed";

  return (
    <div style={{minHeight:"100vh",background:"#fafafa",paddingBottom:"80px"}}>

      {/* 5 min warning banner */}
      {fiveMinWarning && (
        <div style={{background:"#f59e0b",padding:"12px 20px",textAlign:"center"}}>
          <p style={{color:"#000",fontSize:"13px",fontWeight:"500"}}>
            ⏱ Event ends in 5 minutes — finalise your connections
          </p>
        </div>
      )}

      {/* Scene tab */}
      {tab === "scene" && (
        <div style={{padding:"24px 20px"}}>
          <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"24px"}}>
            Presence
          </p>

          {/* Event header */}
          <h1 style={{fontSize:"26px",fontWeight:"500",color:"#0a0a0b",marginBottom:"4px"}}>
            {event?.title}
          </h1>
          <p style={{fontSize:"14px",color:"#666",marginBottom:"2px"}}>📍 {event?.venue}</p>
          <p style={{fontSize:"14px",color:"#999",marginBottom:"24px"}}>
            {event && new Date(event.start_time).toLocaleDateString("en-KE",{weekday:"long",day:"numeric",month:"long"})}
          </p>

          {/* Status / Countdown */}
          {isEnded ? (
            <div style={{background:"#000",borderRadius:"20px",padding:"24px",marginBottom:"16px",textAlign:"center"}}>
              <p style={{color:"#fff",fontSize:"18px",marginBottom:"8px"}}>Event has ended</p>
              <p style={{color:"#666",fontSize:"14px",marginBottom:"16px"}}>Thank you for being present</p>
              <p style={{color:"#999",fontSize:"13px"}}>Your connections are saved in Archive →</p>
            </div>
          ) : isLive ? (
            <div style={{background:"#000",borderRadius:"20px",padding:"20px",marginBottom:"16px",
              display:"flex",alignItems:"center",gap:"12px"}}>
              <span style={{width:"8px",height:"8px",borderRadius:"50%",background:"#4ade80",display:"inline-block"}} />
              <p style={{color:"#fff",fontSize:"16px",fontWeight:"400"}}>Event is live</p>
            </div>
          ) : (
            <div style={{background:"#000",borderRadius:"20px",padding:"24px",marginBottom:"16px"}}>
              <p style={{fontSize:"12px",color:"#666",marginBottom:"16px",letterSpacing:"0.1em"}}>STARTS IN</p>
              <div style={{display:"flex",gap:"16px",justifyContent:"center"}}>
                {[
                  {value: countdown.days, label:"Days"},
                  {value: countdown.hours, label:"Hrs"},
                  {value: countdown.minutes, label:"Min"},
                  {value: countdown.seconds, label:"Sec"},
                ].map(({value, label}) => (
                  <div key={label} style={{textAlign:"center"}}>
                    <p style={{fontSize:"32px",fontWeight:"300",color:"#fff",lineHeight:"1"}}>{String(value).padStart(2,"0")}</p>
                    <p style={{fontSize:"11px",color:"#666",marginTop:"4px"}}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Networking card */}
          <div style={{background:"#fff",borderRadius:"20px",padding:"20px",marginBottom:"16px",
            border:"1px solid rgba(0,0,0,0.06)"}}>
            <p style={{fontSize:"12px",color:"#999",marginBottom:"12px",letterSpacing:"0.1em"}}>LIVE NETWORKING</p>
            <div style={{display:"flex",gap:"24px"}}>
              <div>
                <p style={{fontSize:"28px",fontWeight:"500",color:accentColor}}>{auraCount}</p>
                <p style={{fontSize:"12px",color:"#999"}}>on Aura</p>
              </div>
              <div style={{width:"1px",background:"#f3f4f6"}} />
              <div>
                <p style={{fontSize:"28px",fontWeight:"500",color:accentColor}}>{handshakeCount}</p>
                <p style={{fontSize:"12px",color:"#999"}}>handshakes</p>
              </div>
            </div>
            {!isLive && !isEnded && (
              <p style={{fontSize:"12px",color:"#999",marginTop:"12px"}}>
                Aura networking opens when event starts
              </p>
            )}
          </div>

          {/* Broadcasts */}
          {broadcasts.length > 0 && (
            <div>
              <p style={{fontSize:"12px",color:"#999",marginBottom:"12px",letterSpacing:"0.1em"}}>FROM THE HOST</p>
              {broadcasts.map((b: any) => (
                <div key={b.id} style={{background:"#fff",borderRadius:"16px",padding:"16px",
                  marginBottom:"8px",border:"1px solid rgba(0,0,0,0.06)"}}>
                  <p style={{fontSize:"14px",color:"#0a0a0b"}}>{b.content}</p>
                  <p style={{fontSize:"11px",color:"#999",marginTop:"8px"}}>
                    {new Date(b.sent_at).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aura tab */}
      {tab === "aura" && (
        <div style={{padding:"24px 20px",textAlign:"center"}}>
          <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"32px"}}>
            Aura
          </p>
          {!isLive ? (
            <div style={{padding:"60px 0"}}>
              <p style={{fontSize:"40px",marginBottom:"16px"}}>◎</p>
              <p style={{fontSize:"16px",color:"#333",marginBottom:"8px"}}>Aura is not yet active</p>
              <p style={{fontSize:"14px",color:"#999"}}>Networking opens when the event starts</p>
            </div>
          ) : isEnded ? (
            <div style={{padding:"60px 0"}}>
              <p style={{fontSize:"40px",marginBottom:"16px"}}>◎</p>
              <p style={{fontSize:"16px",color:"#333",marginBottom:"8px"}}>Aura has closed</p>
              <p style={{fontSize:"14px",color:"#999"}}>Your connections are saved in Archive</p>
            </div>
          ) : (
            <div style={{padding:"40px 0"}}>
              <p style={{fontSize:"40px",marginBottom:"16px"}}>◎</p>
              <p style={{fontSize:"16px",color:"#333",marginBottom:"8px"}}>Aura is ready</p>
              <p style={{fontSize:"14px",color:"#999",marginBottom:"32px"}}>Full Aura system coming in next update</p>
              <div style={{background:"#fff",borderRadius:"20px",padding:"20px",border:"1px solid rgba(0,0,0,0.06)"}}>
                <p style={{fontSize:"28px",fontWeight:"500",color:accentColor,marginBottom:"4px"}}>{auraCount}</p>
                <p style={{fontSize:"13px",color:"#999"}}>guests currently on Aura</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ticket tab */}
      {tab === "ticket" && (
        <div style={{padding:"24px 20px"}}>
          <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"32px",textAlign:"center"}}>
            Your Ticket
          </p>
          <div style={{background:"#fff",borderRadius:"24px",padding:"32px",border:"1px solid rgba(0,0,0,0.06)",textAlign:"center",marginBottom:"16px"}}>
            <h2 style={{fontSize:"20px",fontWeight:"500",marginBottom:"4px"}}>{event?.title}</h2>
            <p style={{fontSize:"14px",color:"#666",marginBottom:"4px"}}>📍 {event?.venue}</p>
            <p style={{fontSize:"14px",color:"#999",marginBottom:"24px"}}>
              {event && new Date(event.start_time).toLocaleDateString()}
            </p>
            <div style={{background:"#000",borderRadius:"16px",padding:"32px",marginBottom:"16px"}}>
              <p style={{color:"#fff",fontSize:"14px",marginBottom:"8px"}}>Entry QR</p>
              <p style={{color:"#666",fontSize:"12px"}}>QR code generation coming soon</p>
              <p style={{color:"#444",fontSize:"11px",marginTop:"16px",wordBreak:"break-all"}}>{registration?.id}</p>
            </div>
            <p style={{fontSize:"12px",color:"#999"}}>Show this to the host at the entrance</p>
          </div>
          <div style={{background:"#fff",borderRadius:"24px",padding:"24px",border:"1px solid rgba(0,0,0,0.06)",textAlign:"center"}}>
            <p style={{fontSize:"14px",color:"#666",marginBottom:"8px"}}>Presence QR</p>
            <p style={{fontSize:"12px",color:"#999"}}>For networking unlocks — scan with other guests</p>
          </div>
        </div>
      )}

      {/* Profile tab */}
      {tab === "profile" && (
        <div style={{padding:"24px 20px"}}>
          <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"32px",textAlign:"center"}}>
            Your Profile
          </p>
          <div style={{background:"#fff",borderRadius:"24px",padding:"24px",border:"1px solid rgba(0,0,0,0.06)",marginBottom:"16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"16px",marginBottom:"20px"}}>
              <div style={{width:"48px",height:"48px",borderRadius:"50%",
                background: isPro ? "#2563eb" : "#7c3aed",
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <p style={{color:"#fff",fontSize:"18px",fontWeight:"500"}}>
                  {profile?.display_name?.charAt(0)?.toUpperCase()}
                </p>
              </div>
              <div>
                <p style={{fontSize:"18px",fontWeight:"500"}}>{profile?.display_name}</p>
                <p style={{fontSize:"13px",color: isPro ? "#2563eb" : "#7c3aed"}}>
                  {isPro ? "Professional" : "Creative"}
                </p>
              </div>
            </div>
            {profile?.role_title && <p style={{fontSize:"14px",color:"#333",marginBottom:"4px"}}>{profile.role_title}</p>}
            {profile?.organisation && <p style={{fontSize:"14px",color:"#666",marginBottom:"4px"}}>{profile.organisation}</p>}
            {profile?.bio && <p style={{fontSize:"14px",color:"#999",marginTop:"12px"}}>{profile.bio}</p>}
          </div>
          <div style={{background:"#fff",borderRadius:"20px",padding:"16px",border:"1px solid rgba(0,0,0,0.06)",
            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <p style={{fontSize:"14px",color:"#666"}}>
              {profile?.platform_type}: {profile?.platform_value || "Not set"}
            </p>
          </div>
        </div>
      )}

      {/* Archive tab */}
      {tab === "archive" && (
        <div style={{padding:"24px 20px",textAlign:"center"}}>
          <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"32px"}}>
            Archive
          </p>
          {!isEnded ? (
            <div style={{padding:"60px 0"}}>
              <p style={{fontSize:"40px",marginBottom:"16px"}}>◇</p>
              <p style={{fontSize:"16px",color:"#333",marginBottom:"8px"}}>Archive unlocks after the event</p>
              <p style={{fontSize:"14px",color:"#999"}}>Your connections will appear here</p>
            </div>
          ) : (
            <div style={{padding:"40px 0"}}>
              <p style={{fontSize:"40px",marginBottom:"16px"}}>◇</p>
              <p style={{fontSize:"16px",color:"#333",marginBottom:"8px"}}>Your connections</p>
              <p style={{fontSize:"14px",color:"#999"}}>Full archive coming in next update</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom navigation */}
      <div style={{
        position:"fixed",bottom:0,left:0,right:0,
        background:"rgba(255,255,255,0.95)",
        backdropFilter:"blur(20px)",
        borderTop:"1px solid rgba(0,0,0,0.06)",
        display:"flex",padding:"8px 0 20px",
      }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
              gap:"4px",background:"none",border:"none",cursor:"pointer",padding:"8px 0"}}>
            <span style={{fontSize:"18px",opacity: tab === item.id ? 1 : 0.4}}>
              {item.emoji}
            </span>
            <span style={{fontSize:"10px",color: tab === item.id ? accentColor : "#999",
              fontWeight: tab === item.id ? "600" : "400"}}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}