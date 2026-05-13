"use client";
import{useEffect,useState}from"react";
import{useParams}from"next/navigation";
import{supabase}from"@/lib/supabase/client";

export default function RegisterPage(){
  const[event,setEvent]=useState<any>(null);
  const[ticketTypes,setTicketTypes]=useState<any[]>([]);
  const[selectedTicket,setSelectedTicket]=useState<any>(null);
  const[quantity,setQuantity]=useState(1);
  const[name,setName]=useState("");
  const[email,setEmail]=useState("");
  const[phone,setPhone]=useState("");
  const[loading,setLoading]=useState(true);
  const[submitting,setSubmitting]=useState(false);
  const[success,setSuccess]=useState(false);
  const[guestLink,setGuestLink]=useState("");
  const[error,setError]=useState("");
  const[paymentState,setPaymentState]=useState<"idle"|"waiting"|"success"|"failed">("idle");
  const[checkoutId,setCheckoutId]=useState("");
  const params=useParams();
  const slug=params.slug as string;

  useEffect(()=>{
    async function load(){
      const{data:ev}=await supabase.from("events").select("*").eq("slug",slug).single();
      if(!ev){setLoading(false);return;}
      setEvent(ev);
      const{data:tickets}=await supabase.from("ticket_types").select("*").eq("event_id",ev.id).eq("is_active",true);
      setTicketTypes(tickets??[]);
      if(tickets?.length)setSelectedTicket(tickets[0]);
      setLoading(false);
    }
    load();
  },[slug]);

  function normalizePhone(p:string){
    const d=p.replace(/\D/g,"");
    if(d.startsWith("0")&&d.length===10)return"254"+d.slice(1);
    if(d.startsWith("254"))return d;
    if(d.startsWith("7")&&d.length===9)return"254"+d;
    return d;
  }

  async function pollPayment(cid:string,link:string){
    let attempts=0;
    const interval=setInterval(async()=>{
      attempts++;
      const{data:payment}=await supabase.from("payments").select("status").eq("mpesa_receipt",cid).single();
      if(payment?.status==="success"){
        clearInterval(interval);
        setPaymentState("success");
        setGuestLink(link);
        setSuccess(true);
      }else if(payment?.status==="failed"||attempts>20){
        clearInterval(interval);
        setPaymentState("failed");
        setError("Payment failed or timed out. Please try again.");
        setSubmitting(false);
      }
    },3000);
  }

  async function handleRegister(){
    if(!name||!email){setError("Please fill in your name and email");return;}
    const isPaid=Number(selectedTicket?.price)>0;
    if(isPaid&&!phone){setError("Phone number required for M-Pesa payment");return;}
    setSubmitting(true);
    setError("");

    // Create one registration per quantity
    const accessToken=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,"0")).join("");
    const guestUrl=window.location.origin+"/e/"+event.slug+"/g/"+accessToken;
    const totalAmount=Number(selectedTicket?.price??0)*quantity;

    const{data:reg,error:regError}=await supabase.from("registrations").insert({
      event_id:event.id,
      ticket_type_id:selectedTicket?.id,
      guest_name:name,
      guest_email:email,
      guest_phone:phone,
      status:isPaid?"pending":"confirmed",
      amount:totalAmount,
      paid:!isPaid,
      access_token:accessToken,
      guest_access_link:guestUrl,
    }).select().single();

    if(regError){setError(regError.message);setSubmitting(false);return;}

    if(!isPaid){
      setGuestLink(guestUrl);
      setSuccess(true);
      setSubmitting(false);
      return;
    }

    // Paid — trigger M-Pesa STK Push
    const norm=normalizePhone(phone);
    const res=await fetch("/api/payments/initiate",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({phone:norm,amount:totalAmount,registration_id:reg.id})
    });
    const data=await res.json();
    if(!res.ok){setError(data.error||"Payment initiation failed");setSubmitting(false);return;}
    setCheckoutId(data.checkout_request_id);
    setPaymentState("waiting");
    pollPayment(data.checkout_request_id,guestUrl);
  }

  function copyLink(link:string){
    const el=document.createElement("textarea");
    el.value=link;el.style.position="fixed";el.style.opacity="0";
    document.body.appendChild(el);el.focus();el.select();
    try{document.execCommand("copy");}catch(e){}
    document.body.removeChild(el);
  }

  if(loading)return(
    <div style={{minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"#666"}}>Loading...</p>
    </div>
  );

  if(!event)return(
    <div style={{minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"#666"}}>Event not found</p>
    </div>
  );

  if(paymentState==="waiting")return(
    <div style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#666",textTransform:"uppercase",marginBottom:"32px"}}>Presence</p>
      <p style={{fontSize:"48px",marginBottom:"24px"}}>📱</p>
      <h1 style={{fontSize:"24px",fontWeight:"300",color:"#fff",textAlign:"center",marginBottom:"12px"}}>Check your phone</h1>
      <p style={{color:"#666",textAlign:"center",marginBottom:"8px"}}>An M-Pesa prompt has been sent to</p>
      <p style={{color:"#fff",fontSize:"18px",fontWeight:"500",marginBottom:"32px"}}>{phone}</p>
      <p style={{color:"#555",fontSize:"13px",textAlign:"center",marginBottom:"32px"}}>Enter your M-Pesa PIN to complete payment. This page will update automatically.</p>
      <div style={{display:"flex",gap:"8px",marginBottom:"32px"}}>
        {[0,1,2].map(i=><div key={i} style={{width:"8px",height:"8px",borderRadius:"50%",background:"#444"}}/>)}
      </div>
      {error&&<p style={{color:"#ef4444",fontSize:"14px",textAlign:"center",marginBottom:"16px"}}>{error}</p>}
      <button onClick={()=>{setPaymentState("idle");setSubmitting(false);}} style={{padding:"12px 24px",borderRadius:"12px",background:"transparent",border:"1px solid #333",color:"#666",fontSize:"14px",cursor:"pointer"}}>Cancel</button>
    </div>
  );

  if(success)return(
    <div style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#666",textTransform:"uppercase",marginBottom:"32px"}}>Presence</p>
      <p style={{fontSize:"40px",marginBottom:"16px"}}>✓</p>
      <h1 style={{fontSize:"24px",fontWeight:"300",color:"#fff",textAlign:"center",marginBottom:"8px"}}>You are in.</h1>
      <p style={{color:"#666",textAlign:"center",marginBottom:"32px"}}>{event.title}</p>
      <div style={{background:"#111",borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"360px",marginBottom:"24px"}}>
        <p style={{fontSize:"12px",color:"#666",marginBottom:"8px"}}>YOUR EXPERIENCE LINK</p>
        <p style={{fontSize:"13px",color:"#fff",wordBreak:"break-all",marginBottom:"16px"}}>{guestLink.replace("https://","").replace("http://","")}</p>
        <div style={{display:"flex",gap:"8px"}}>
          <button onClick={()=>copyLink(guestLink)} style={{flex:1,padding:"12px",borderRadius:"12px",background:"#fff",color:"#000",border:"none",fontSize:"14px",cursor:"pointer",fontWeight:"500"}}>Copy link</button>
          {typeof navigator!=="undefined"&&navigator.share&&<button onClick={()=>navigator.share({title:"My Presence ticket",text:"Join me at "+event.title,url:guestLink})} style={{padding:"12px 16px",borderRadius:"12px",background:"#222",color:"#fff",border:"none",fontSize:"14px",cursor:"pointer"}}>Share</button>}
        </div>
      </div>
      <p style={{color:"#444",fontSize:"13px",textAlign:"center",marginBottom:"24px"}}>Save this link. It is your ticket and networking pass.</p>
      <a href={guestLink} style={{display:"block",textAlign:"center",padding:"16px",borderRadius:"16px",background:"#fff",color:"#000",textDecoration:"none",fontSize:"15px",fontWeight:"500",width:"100%",maxWidth:"360px",boxSizing:"border-box"}}>Enter Presence →</a>
    </div>
  );

  const isPaid=Number(selectedTicket?.price)>0;
  const total=Number(selectedTicket?.price??0)*quantity;

  return(
    <div style={{minHeight:"100vh",background:"#000",padding:"40px 24px"}}>
      <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#666",textTransform:"uppercase",marginBottom:"40px",textAlign:"center"}}>Presence</p>
      <div style={{maxWidth:"480px",margin:"0 auto"}}>
        <h1 style={{fontSize:"28px",fontWeight:"300",color:"#fff",marginBottom:"8px"}}>{event.title}</h1>
        <p style={{color:"#666",marginBottom:"4px"}}>📍 {event.venue}</p>
        <p style={{color:"#555",marginBottom:"32px",fontSize:"14px"}}>{new Date(event.start_time).toLocaleDateString("en-KE",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>

        {ticketTypes.length>0&&(
          <div style={{marginBottom:"24px"}}>
            <p style={{fontSize:"12px",color:"#666",marginBottom:"12px",letterSpacing:"0.1em"}}>SELECT TICKET</p>
            {ticketTypes.map(t=>(
              <div key={t.id} onClick={()=>{setSelectedTicket(t);setQuantity(1);}} style={{padding:"16px",borderRadius:"14px",border:"1px solid "+(selectedTicket?.id===t.id?"#fff":"#222"),marginBottom:"8px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <p style={{color:"#fff",fontSize:"15px"}}>{t.name}</p>
                <p style={{color:t.price>0?"#60a5fa":"#4ade80",fontSize:"15px",fontWeight:"500"}}>{t.price>0?"KES "+t.price:"Free"}</p>
              </div>
            ))}
          </div>
        )}

        {isPaid&&(
          <div style={{marginBottom:"24px"}}>
            <p style={{fontSize:"12px",color:"#666",marginBottom:"12px",letterSpacing:"0.1em"}}>QUANTITY</p>
            <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
              <button onClick={()=>setQuantity(q=>Math.max(1,q-1))} style={{width:"40px",height:"40px",borderRadius:"10px",background:"#111",border:"1px solid #333",color:"#fff",fontSize:"20px",cursor:"pointer"}}>−</button>
              <p style={{color:"#fff",fontSize:"18px",fontWeight:"500",minWidth:"32px",textAlign:"center"}}>{quantity}</p>
              <button onClick={()=>setQuantity(q=>Math.min(10,q+1))} style={{width:"40px",height:"40px",borderRadius:"10px",background:"#111",border:"1px solid #333",color:"#fff",fontSize:"20px",cursor:"pointer"}}>+</button>
              <p style={{color:"#666",fontSize:"14px"}}>× KES {selectedTicket?.price} = <span style={{color:"#fff",fontWeight:"500"}}>KES {total.toLocaleString()}</span></p>
            </div>
          </div>
        )}

        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" style={{width:"100%",padding:"16px",borderRadius:"14px",border:"1px solid #222",background:"#111",color:"#fff",fontSize:"15px",outline:"none",marginBottom:"12px",boxSizing:"border-box"}}/>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={{width:"100%",padding:"16px",borderRadius:"14px",border:"1px solid #222",background:"#111",color:"#fff",fontSize:"15px",outline:"none",marginBottom:"12px",boxSizing:"border-box"}}/>
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder={isPaid?"Phone 07XXXXXXXX (required for M-Pesa)":"Phone 07XXXXXXXX"} type="tel" style={{width:"100%",padding:"16px",borderRadius:"14px",border:"1px solid "+(isPaid?"#2563eb":"#222"),background:"#111",color:"#fff",fontSize:"15px",outline:"none",marginBottom:"24px",boxSizing:"border-box"}}/>

        {error&&<p style={{color:"#ef4444",fontSize:"13px",marginBottom:"16px"}}>{error}</p>}

        <button onClick={handleRegister} disabled={submitting} style={{width:"100%",padding:"16px",borderRadius:"16px",background:submitting?"#333":"#fff",color:"#000",border:"none",fontSize:"15px",fontWeight:"500",cursor:submitting?"not-allowed":"pointer"}}>
          {submitting?"Processing...":isPaid?"Pay KES "+total.toLocaleString()+" with M-Pesa":"Get free ticket"}
        </button>
      </div>
    </div>
  );
}
