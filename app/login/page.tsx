"use client";
import{useState}from"react";
import{supabase}from"@/lib/supabase/client";
import OreetiLogo from"@/components/OreetiLogo";

type Mode="landing"|"signup"|"login"|"sent";

export default function LoginPage(){
  const[mode,setMode]=useState<Mode>("landing");
  const[name,setName]=useState("");
  const[email,setEmail]=useState("");
  const[phone,setPhone]=useState("");
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");

  const inp={
    width:"100%",
    padding:"14px 16px",
    borderRadius:"14px",
    border:"1px solid #222",
    background:"#111",
    color:"#fff",
    fontSize:"15px",
    outline:"none",
    boxSizing:"border-box" as const,
    fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  };

  async function handleSignup(){
    if(!name.trim()){setError("Please enter your name");return;}
    if(!email.trim()){setError("Please enter your email");return;}
    if(!phone.trim()){setError("Please enter your M-Pesa phone number");return;}
    const digits=phone.replace(/\D/g,"");
    if(digits.length<9){setError("Please enter a valid phone number");return;}
    setLoading(true);
    setError("");

    const{error:err}=await supabase.auth.signInWithOtp({
      email,
      options:{
        emailRedirectTo:"https://presence-bb5i.vercel.app/auth/callback",
        data:{name,phone},
      },
    });

    if(err){setError(err.message);setLoading(false);return;}

    // Save to hosts table
    await supabase.from("hosts").upsert({
      email,
      name,
      phone,
    },{onConflict:"email"});

    setMode("sent");
    setLoading(false);
  }

  async function handleLogin(){
    if(!email.trim()){setError("Please enter your email");return;}
    setLoading(true);
    setError("");

    const{error:err}=await supabase.auth.signInWithOtp({
      email,
      options:{
        emailRedirectTo:"https://presence-bb5i.vercel.app/auth/callback",
      },
    });

    if(err){setError(err.message);setLoading(false);return;}
    setMode("sent");
    setLoading(false);
  }

  // Landing
  if(mode==="landing")return(
    <main style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
      <div style={{marginBottom:"64px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <OreetiLogo size="sm"/>
      </div>

      <div style={{width:"100%",maxWidth:"320px",display:"flex",flexDirection:"column",gap:"12px"}}>
        <button onClick={()=>setMode("signup")} style={{width:"100%",padding:"16px",borderRadius:"16px",background:"#fff",color:"#000",border:"none",fontSize:"15px",fontWeight:"600",cursor:"pointer",letterSpacing:"-0.01em"}}>
          Create an account
        </button>
        <button onClick={()=>setMode("login")} style={{width:"100%",padding:"16px",borderRadius:"16px",background:"transparent",color:"#fff",border:"1px solid #222",fontSize:"15px",fontWeight:"400",cursor:"pointer"}}>
          Sign in
        </button>
      </div>

      <p style={{color:"#333",fontSize:"11px",marginTop:"48px",textAlign:"center",lineHeight:"1.6"}}>
        By continuing you agree to our{" "}
        <a href="/terms" target="_blank" style={{color:"#555",textDecoration:"underline"}}>Terms of Use</a>
        {" "}and{" "}
        <a href="/privacy" target="_blank" style={{color:"#555",textDecoration:"underline"}}>Privacy Policy</a>
      </p>
    </main>
  );

  // Sent
  if(mode==="sent")return(
    <main style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
      <h1 style={{fontSize:"48px",marginBottom:"24px"}}>✉️</h1>
      <h2 style={{fontSize:"22px",fontWeight:"500",color:"#fff",textAlign:"center",marginBottom:"12px"}}>Check your email</h2>
      <p style={{color:"#555",textAlign:"center",marginBottom:"8px",fontSize:"14px"}}>We sent a magic link to</p>
      <p style={{color:"#fff",textAlign:"center",marginBottom:"48px",fontSize:"15px",fontWeight:"500"}}>{email}</p>
      <p style={{color:"#333",fontSize:"13px",textAlign:"center",lineHeight:"1.6"}}>Click the link to sign in.{"\n"}No password needed.</p>
      <button onClick={()=>{setMode("landing");setEmail("");setName("");setPhone("");}} style={{marginTop:"32px",padding:"12px 24px",borderRadius:"12px",background:"transparent",border:"1px solid #222",color:"#555",fontSize:"13px",cursor:"pointer"}}>← Back</button>
    </main>
  );

  // Signup
  if(mode==="signup")return(
    <main style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",padding:"32px 24px"}}>
      <button onClick={()=>{setMode("landing");setError("");}} style={{background:"none",border:"none",color:"#555",fontSize:"20px",cursor:"pointer",marginBottom:"32px",alignSelf:"flex-start"}}>←</button>

      <div style={{marginBottom:"32px"}}>
        <div style={{marginBottom:"16px"}}><OreetiLogo size="sm"/></div>
        <h1 style={{fontSize:"28px",fontWeight:"600",color:"#fff",letterSpacing:"-0.02em",marginBottom:"8px"}}>Create account</h1>
        <p style={{fontSize:"14px",color:"#555"}}>Start hosting intentional events</p>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"24px"}}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" type="text" style={inp}/>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={inp}/>
        <div style={{position:"relative"}}>
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+254XXXXXXXXX" type="tel" style={{...inp,paddingLeft:"16px"}}/>
          <p style={{fontSize:"11px",color:"#444",marginTop:"6px",paddingLeft:"4px"}}>M-Pesa number for ticket payouts</p>
        </div>
      </div>

      {error&&<p style={{color:"#ef4444",fontSize:"13px",marginBottom:"16px",textAlign:"center"}}>{error}</p>}

      <button onClick={handleSignup} disabled={loading} style={{width:"100%",padding:"16px",borderRadius:"16px",background:loading?"#222":"#fff",color:loading?"#555":"#000",border:"none",fontSize:"15px",fontWeight:"600",cursor:loading?"not-allowed":"pointer"}}>
        {loading?"Sending link...":"Continue →"}
      </button>

      <p style={{color:"#333",fontSize:"12px",marginTop:"24px",textAlign:"center"}}>
        Already have an account?{" "}
        <span onClick={()=>{setMode("login");setError("");}} style={{color:"#555",cursor:"pointer",textDecoration:"underline"}}>Sign in</span>
      </p>
    </main>
  );

  // Login
  return(
    <main style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",padding:"32px 24px"}}>
      <button onClick={()=>{setMode("landing");setError("");}} style={{background:"none",border:"none",color:"#555",fontSize:"20px",cursor:"pointer",marginBottom:"32px",alignSelf:"flex-start"}}>←</button>

      <div style={{marginBottom:"32px"}}>
        <div style={{marginBottom:"16px"}}><OreetiLogo size="sm"/></div>
        <h1 style={{fontSize:"28px",fontWeight:"600",color:"#fff",letterSpacing:"-0.02em",marginBottom:"8px"}}>Welcome back</h1>
        <p style={{fontSize:"14px",color:"#555"}}>Sign in to your organizer account</p>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"24px"}}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={inp}/>
      </div>

      {error&&<p style={{color:"#ef4444",fontSize:"13px",marginBottom:"16px",textAlign:"center"}}>{error}</p>}

      <button onClick={handleLogin} disabled={loading} style={{width:"100%",padding:"16px",borderRadius:"16px",background:loading?"#222":"#fff",color:loading?"#555":"#000",border:"none",fontSize:"15px",fontWeight:"600",cursor:loading?"not-allowed":"pointer"}}>
        {loading?"Sending link...":"Send magic link →"}
      </button>

      <p style={{color:"#333",fontSize:"12px",marginTop:"24px",textAlign:"center"}}>
        New to Oreeti?{" "}
        <span onClick={()=>{setMode("signup");setError("");}} style={{color:"#555",cursor:"pointer",textDecoration:"underline"}}>Create account</span>
      </p>
    </main>
  );
}
