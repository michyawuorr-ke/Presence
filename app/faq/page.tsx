"use client";
import React, { useEffect, useState } from "react";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          el.style.animationDelay = (el.dataset.delay || "0") + "ms";
          el.classList.add("reveal");
          io.unobserve(el);
        }
      }),
      { threshold: 0.1 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const faqs = [
  {
    category: "The basics",
    items: [
      {
        q: "What exactly is Oreeti?",
        a: "Oreeti is a live event activation platform — the infrastructure that turns a passive audience into an active network. It handles guest registration, ticketing, check-in, and in-event connection, all within a single experience guests access from their phone browser. No app download required.",
      },
      {
        q: "How is Oreeti different from a ticketing platform?",
        a: "Ticketing platforms stop at the door. Oreeti starts there. We handle ticketing — but the core product is what happens inside the event: the discovery, the connections, the activation. We are less interested in who bought a ticket than in who met someone worth knowing.",
      },
      {
        q: "How is Oreeti different from LinkedIn or business card apps?",
        a: "LinkedIn is an archive. Business card apps are digital clipboards. Oreeti is a live, context-aware layer that only exists during the event. Connections are mutual, verified by physical presence, and earned through intent — not just a follow.",
      },
    ],
  },
  {
    category: "For organizers",
    items: [
      {
        q: "What does it cost to use Oreeti?",
        a: "Creating events and running free events costs nothing. For paid events, Oreeti takes a 5% platform fee on ticket sales. There is no subscription, no monthly fee, and no charge per attendee on free events.",
      },
      {
        q: "How do guest payments work?",
        a: "Guests pay via M-Pesa STK Push — a prompt is sent directly to their phone. Payments reconcile automatically. You see the status in your dashboard in real time.",
      },
      {
        q: "Do guests need to download an app?",
        a: "No. Guests access the entire experience — registration, profile, ticket, networking, QR code — through a standard browser link. Nothing to download, nothing to install.",
      },
      {
        q: "Can I see what's happening during my event?",
        a: "Yes. Your organizer dashboard shows registrations, check-ins, and networking activity in real time. You can see connections forming and networking activity as it happens.",
      },
    ],
  },
  {
    category: "For attendees",
    items: [
      {
        q: "What can other people see about me?",
        a: "Only what you choose. If networking is off, you're invisible. If it's on, other attendees see your first name and first initial only. Your full profile — role, organisation, bio, and links — is only visible to someone you've mutually connected with and scanned.",
      },
      {
        q: "What is a handshake?",
        a: "A handshake is a mutual connection. You send a request with a reason. If the other person accepts, you both scan each other's QR code to confirm. Both parties have to want the connection — that's what makes it meaningful.",
      },
      {
        q: "What happens to my connections after the event ends?",
        a: "They stay. Your connections, notes, and unlocked profiles are preserved permanently after the event ends. The room closes, but the relationships don't.",
      },
    ],
  },
  {
    category: "Privacy",
    items: [
      {
        q: "Who can see my data?",
        a: "Organizers can see your registration details (name, email, ticket type, check-in status). They cannot see your networking activity or who you connected with. Full profile details are only ever visible to people you have mutually connected with.",
      },
      {
        q: "Does Oreeti sell or share my data?",
        a: "No. We do not sell your data. We do not share it with advertisers. We share data with infrastructure providers (Supabase, Vercel, Safaricom) solely to operate the platform. Read our privacy policy for the full picture.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: "1px solid rgba(138,115,85,0.1)",
      cursor: "pointer",
    }}
      onClick={() => setOpen(!open)}
    >
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "24px 0", gap: 16,
      }}>
        <p style={{
          fontSize: 15, fontWeight: 500, color: "var(--ivory)", margin: 0, lineHeight: 1.4,
        }}>
          {q}
        </p>
        <div style={{
          width: 20, height: 20, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.25s",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
          color: "var(--dusk)",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
      {open && (
        <p style={{
          color: "var(--dusk)", fontSize: 14, lineHeight: 1.75,
          margin: "0 0 24px", paddingRight: 36,
        }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function FAQPage() {
  useReveal();
  return (
    <div style={{ background: "var(--base)", minHeight: "100vh" }}>
      <style>{`body { max-width: 100% !important; }`}</style>
      <Nav />

      <section style={{ padding: "160px 32px 80px", maxWidth: 800, margin: "0 auto" }}>
        <p className="eyebrow reveal" style={{ marginBottom: 20 }}>Questions</p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(34px,5vw,60px)",
          fontWeight: 500,
          color: "var(--ivory)",
          lineHeight: 1.1,
          letterSpacing: "-0.025em",
          margin: "0 0 24px",
        }}
          data-reveal
        >
          Everything worth asking.
        </h1>
        <p style={{
          fontSize: 16, color: "var(--dusk)", lineHeight: 1.75,
        }}
          data-reveal data-delay="100"
        >
          If you have a question not answered here, email <a href="mailto:hello.oreeti@gmail.com" style={{ color: "var(--ivory)", textDecoration: "none", borderBottom: "1px solid rgba(234,230,223,0.2)" }}>hello.oreeti@gmail.com</a>
        </p>
      </section>

      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 32px 120px" }}>
        {faqs.map((group, gi) => (
          <div key={group.category} data-reveal data-delay={String(gi * 80)} style={{ marginBottom: 64 }}>
            <p className="eyebrow" style={{ marginBottom: 24 }}>{group.category}</p>
            {group.items.map(item => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
}
