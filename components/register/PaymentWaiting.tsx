"use client";

interface Props {
  phone: string;
  amount: number;
  stkFailed: boolean;
  error: string;
  onReset: () => void;
}

export default function PaymentWaiting({ phone, amount, stkFailed, error, onReset }: Props) {
  return (
    <main style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
      <div style={{maxWidth:"420px",width:"100%"}}>
        <style>{"@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.85)}}"}</style>
        <div style={{border:"1px solid rgba(255,255,255,0.06)",borderRadius:"20px",padding:"32px 24px",marginBottom:"24px",textAlign:"center"}}>
          <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2"/>
              <line x1="12" y1="18" x2="12" y2="18.01"/>
            </svg>
          </div>
          <p style={{fontSize:"11px",letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)",marginBottom:"8px"}}>
            {stkFailed ? "Pay via M-Pesa" : "M-Pesa Request Sent"}
          </p>
          <p style={{fontSize:"22px",fontWeight:"300",color:"#f5f5f5",marginBottom:"4px"}}>KES {amount}</p>
          <p style={{fontSize:"13px",color:"rgba(255,255,255,0.4)",marginBottom:"24px"}}>to Oreeti</p>
          {!stkFailed && (
            <div style={{background:"rgba(255,255,255,0.02)",borderRadius:"12px",padding:"14px",marginBottom:"8px"}}>
              <p style={{fontSize:"12px",color:"rgba(255,255,255,0.3)",marginBottom:"4px"}}>Payment requested to</p>
              <p style={{fontSize:"15px",fontWeight:"600",color:"#f0ede8",letterSpacing:"0.04em"}}>{phone}</p>
            </div>
          )}
          <p style={{fontSize:"12px",color:"rgba(255,255,255,0.25)",lineHeight:"1.6"}}>
            {stkFailed ? "Enter your M-Pesa PIN on your phone after paying below." : "Check your phone and enter your M-Pesa PIN to complete payment"}
          </p>
          {stkFailed && (
            <div style={{marginTop:"20px",padding:"16px",background:"rgba(255,255,255,0.02)",borderRadius:"12px",textAlign:"left"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
                <span style={{fontSize:"12px",color:"rgba(255,255,255,0.4)"}}>Paybill</span>
                <span style={{fontSize:"15px",fontWeight:"700",color:"#fff"}}>516600</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
                <span style={{fontSize:"12px",color:"rgba(255,255,255,0.4)"}}>Account</span>
                <span style={{fontSize:"15px",fontWeight:"700",color:"#E26D34"}}>955154</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:"12px",color:"rgba(255,255,255,0.4)"}}>Amount</span>
                <span style={{fontSize:"15px",fontWeight:"700",color:"#D4AF37"}}>KES {amount}</span>
              </div>
            </div>
          )}
        </div>
        <div style={{textAlign:"center",marginBottom:"28px"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:"8px",padding:"10px 20px",borderRadius:"20px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)"}}>
            <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#22c55e",display:"inline-block",animation:"pulse 1.5s ease-in-out infinite"}} />
            <span style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em"}}>
              {stkFailed ? "WAITING FOR PAYMENT" : "WAITING FOR PIN"}
            </span>
          </div>
        </div>
        {error && <p style={{color:"#ef4444",fontSize:"12px",textAlign:"center",marginBottom:"16px"}}>{error}</p>}
        <button onClick={onReset} style={{display:"block",width:"100%",background:"none",border:"none",color:"rgba(255,255,255,0.15)",fontSize:"11px",cursor:"pointer",letterSpacing:"0.05em",textTransform:"uppercase",textAlign:"center"}}>
          Start Over
        </button>
      </div>
    </main>
  );
}
