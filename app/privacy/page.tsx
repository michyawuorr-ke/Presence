export default function PrivacyPage(){
  const sections=[
    {title:"1. Our Commitment",body:"Oreeti is built on consent. Everything about how we handle data reflects our core belief: connection should be intentional, not extracted. We collect only what we need, share only what you choose, and protect everything in between."},
    {title:"2. What We Collect",body:"From organizers: name, email address, and M-Pesa phone number for payouts. From guests: name, email, and optionally phone number at registration. Guests also create a profile with display name, role, organisation, bio, and one link. We collect event interaction data: networking activity, connections, handshakes, QR scans, and check-in status."},
    {title:"3. What We Do Not Collect",body:"We do not collect M-Pesa PINs or payment card details. We do not collect location data. We do not collect device contacts. We do not run advertising trackers. We do not build behavioral profiles for third-party use."},
    {title:"4. How Your Profile Works",body:"Your guest profile has three visibility states. Invisible: networking is off, nobody sees you. Visible: networking is on, other active guests see your first name and initial only. Unlocked: you have mutually connected and completed a QR scan — full profile visible only to that person. You control your visibility at all times."},
    {title:"5. Who Can See What",body:"Other guests see your first name and initial only when you are networking. Full profile details are only visible to guests you have mutually unlocked. Organizers can see your registration details: name, email, phone, ticket type, and check-in status. Organizers cannot see your networking activity or who you connected with."},
    {title:"6. Payments and Financial Data",body:"Ticket payments are processed via M-Pesa through Safaricom Daraja. We store payment status and M-Pesa receipt numbers for reconciliation only. We do not store full M-Pesa account details. Organizer payout details are stored securely and used only for transferring ticket revenue."},
    {title:"7. Data Storage and Security",body:"Your data is stored on Supabase infrastructure with row-level security — each user can only access data they are permitted to see. API routes are rate-limited and inputs are sanitized. All data is transmitted over HTTPS. Authentication is handled via secure magic links — no passwords stored."},
    {title:"8. Data Sharing",body:"We do not sell your data. We do not share your data with advertisers. We share data with infrastructure providers (Supabase, Vercel, Safaricom) solely to operate the platform. We may share anonymized aggregated data for product research."},
    {title:"9. Your Rights",body:"You have the right to access, correct, or delete the data we hold about you. You have the right to withdraw consent for data processing. To exercise these rights email hello.oreeti@gmail.com with subject 'Data Request'."},
    {title:"10. Cookies",body:"Oreeti uses minimal cookies for authentication only. No tracking cookies. No advertising cookies. No third-party analytics that follow you across other websites."},
    {title:"11. Children",body:"Oreeti is not intended for users under 18 years of age. We do not knowingly collect data from minors."},
    {title:"12. Changes",body:"We may update this policy as Oreeti evolves. We will notify you of significant changes via email."},
    {title:"13. Contact",body:"For privacy questions or data requests email hello.oreeti@gmail.com. We aim to respond within 48 hours."},
  ];
  return(
    <main style={{minHeight:"100vh",background:"#fff",padding:"40px 24px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",maxWidth:"680px",margin:"0 auto"}}>
      <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"4px"}}>Oreeti</p>
      <p style={{fontSize:"12px",color:"#bbb",marginBottom:"32px",fontStyle:"italic"}}>The room, activated.</p>
      <h1 style={{fontSize:"28px",fontWeight:"700",color:"#0a0a0b",marginBottom:"8px",letterSpacing:"-0.02em"}}>Privacy Policy</h1>
      <p style={{fontSize:"13px",color:"#999",marginBottom:"40px"}}>Last updated: May 2026</p>
      {sections.map(s=>(
        <div key={s.title} style={{marginBottom:"32px"}}>
          <h2 style={{fontSize:"15px",fontWeight:"600",color:"#0a0a0b",marginBottom:"8px"}}>{s.title}</h2>
          <p style={{fontSize:"14px",color:"#555",lineHeight:"1.8"}}>{s.body}</p>
        </div>
      ))}
      <div style={{borderTop:"1px solid #f3f4f6",paddingTop:"32px",marginTop:"40px",textAlign:"center"}}>
        <p style={{fontSize:"13px",color:"#999"}}>© 2026 Oreeti. All rights reserved.</p>
        <a href="/terms" style={{fontSize:"13px",color:"#aaa",marginTop:"8px",display:"block"}}>Terms of Use →</a>
      </div>
    </main>
  );
}
