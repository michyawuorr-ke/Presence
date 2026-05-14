export default function TermsPage(){
  const sections=[
    {title:"1. What Oreeti Is",body:"Oreeti is a live event activation platform — not a social network, not a ticketing company. We give event organizers the infrastructure to turn passive attendance into intentional human connection. Guests connect in real time, on the ground, at the event. Oreeti makes that possible without pressure, awkwardness, or friction. The room, activated."},
    {title:"2. Who These Terms Apply To",body:"These terms apply to two types of users: Organizers who create and manage events on Oreeti, and Guests who register and participate in events. By using Oreeti in any capacity you agree to these terms."},
    {title:"3. Organizer Responsibilities",body:"As an organizer you are responsible for the events you create. You must ensure your events comply with Kenyan law. You are responsible for communicating clearly with your guests about the Oreeti experience. You must not create events intended to deceive, harm, or defraud attendees. Oreeti reserves the right to remove events that violate these terms without notice."},
    {title:"4. Guest Experience",body:"Guests join events via a unique access link. Each guest creates a profile visible only within that event. Networking is opt-in — guests choose when to become visible to others. Full profile details are only revealed through mutual consent: both guests must connect and complete a QR scan. Guests can turn off networking at any time to become invisible."},
    {title:"5. Ticketing and Payments",body:"Oreeti supports both free and paid events. For paid events, ticket purchases are processed via M-Pesa. Oreeti charges a 5% platform fee on all paid ticket sales. This fee covers payment processing, platform infrastructure, and guest experience tools. The remaining amount is transferred to the organizer. All payments are final unless the event is cancelled by the organizer. In case of disputes contact hello.oreeti@gmail.com."},
    {title:"6. Event Lifecycle",body:"Events move through four stages: Draft, Scheduled, Live, and Ended. Once an event ends no new connections can be made. Existing connections and profile unlocks are preserved permanently. Organizers can access their event report and data after the event ends."},
    {title:"7. Post-Event Data",body:"After an event ends organizers receive an activation report summarizing registrations, check-ins, networking activity, and connections made. Guest personal data in reports may only be used for legitimate post-event follow-up and not for marketing without consent."},
    {title:"8. Prohibited Conduct",body:"You must not use Oreeti to harass, spam, or intimidate other users. You must not create fake profiles or impersonate others. You must not attempt to extract or scrape data from the platform. You must not use Oreeti for any unlawful purpose. Violations may result in immediate removal."},
    {title:"9. Intellectual Property",body:"Oreeti, its name, logo, and tagline 'The room, activated.' are brand property and may not be reproduced without permission. Content you create on Oreeti — your profile, bio, and links — remains yours."},
    {title:"10. Limitation of Liability",body:"Oreeti is provided as-is. We are not liable for losses arising from failed payments, missed connections, or data loss. Our total liability to any user shall not exceed the amount paid to Oreeti in the preceding 3 months."},
    {title:"11. Governing Law",body:"These terms are governed by the laws of Kenya. Any disputes shall be resolved under Kenyan jurisdiction."},
    {title:"12. Contact",body:"For questions about these terms email hello.oreeti@gmail.com. We aim to respond within 48 hours."},
  ];
  return(
    <main style={{minHeight:"100vh",background:"#fff",padding:"40px 24px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",maxWidth:"680px",margin:"0 auto"}}>
      <p style={{fontSize:"11px",letterSpacing:"0.3em",color:"#999",textTransform:"uppercase",marginBottom:"4px"}}>Oreeti</p>
      <p style={{fontSize:"12px",color:"#bbb",marginBottom:"32px",fontStyle:"italic"}}>The room, activated.</p>
      <h1 style={{fontSize:"28px",fontWeight:"700",color:"#0a0a0b",marginBottom:"8px",letterSpacing:"-0.02em"}}>Terms of Use</h1>
      <p style={{fontSize:"13px",color:"#999",marginBottom:"40px"}}>Last updated: May 2025</p>
      {sections.map(s=>(
        <div key={s.title} style={{marginBottom:"32px"}}>
          <h2 style={{fontSize:"15px",fontWeight:"600",color:"#0a0a0b",marginBottom:"8px"}}>{s.title}</h2>
          <p style={{fontSize:"14px",color:"#555",lineHeight:"1.8"}}>{s.body}</p>
        </div>
      ))}
      <div style={{borderTop:"1px solid #f3f4f6",paddingTop:"32px",marginTop:"40px",textAlign:"center"}}>
        <p style={{fontSize:"13px",color:"#999"}}>© 2025 Oreeti. All rights reserved.</p>
        <a href="/privacy" style={{fontSize:"13px",color:"#aaa",marginTop:"8px",display:"block"}}>Privacy Policy →</a>
      </div>
    </main>
  );
}
