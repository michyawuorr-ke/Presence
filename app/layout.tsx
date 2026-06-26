import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Oreeti — The room, activated.",
    template: "%s | Oreeti",
  },
  description: "Oreeti is the networking layer for live events. Attendee discovery, intent-based connections, meetup coordination, and M-Pesa ticketing — built for African events.",
  keywords: ["event networking platform", "attendee networking", "live event connections", "M-Pesa event ticketing", "Nairobi events", "professional networking Africa", "event engagement platform", "networking at conferences Kenya"],
  openGraph: {
    title: "Oreeti — The room, activated.",
    description: "Oreeti is the networking layer for live events. Attendee discovery, intent-based connections, and meetup coordination — built for African events.",
    url: "https://oreeti.com",
    siteName: "Oreeti",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Oreeti — The room, activated.",
    description: "Oreeti is the networking layer for live events. Real connections. Built for Africa.",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://oreeti.com"),
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Oreeti",
  "url": "https://oreeti.com",
  "description": "Oreeti is the networking layer for live events. It helps event organizers give attendees a structured way to discover, connect with, and meet the right people at conferences, summits, and professional gatherings.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "KES",
    "description": "Free to start. 5% fee on paid ticket sales."
  },
  "creator": {
    "@type": "Organization",
    "name": "Oreeti",
    "url": "https://oreeti.com",
    "location": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Nairobi",
        "addressCountry": "KE"
      }
    }
  },
  "audience": {
    "@type": "Audience",
    "audienceType": "Event organizers, conference hosts, community builders, startup ecosystems, professional associations"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{
        fontFamily: "var(--font-inter),-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        background: "#0a0a0c",
        color: "#EAE6DF",
      }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
