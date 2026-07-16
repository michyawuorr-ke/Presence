// Server component — exports static metadata Google can read at crawl time.
// The actual page content is in HomeClient (client component for animations).
import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Oreeti — The room, activated.",
  description: "Oreeti is the live event activation platform for East Africa. QR-based networking handshakes, M-Pesa ticketing, consent-first connections, and real-time event intelligence — built for professional events in Nairobi and beyond.",
  keywords: [
    "event networking Kenya",
    "event technology Nairobi",
    "M-Pesa event ticketing",
    "professional networking events",
    "live event platform East Africa",
    "event check-in app Kenya",
    "networking at events",
    "Oreeti",
  ],
  alternates: {
    canonical: "https://oreeti.com",
  },
  openGraph: {
    title: "Oreeti — The room, activated.",
    description: "The live event activation platform for East Africa. QR networking, M-Pesa ticketing, and consent-first connections.",
    url: "https://oreeti.com",
    siteName: "Oreeti",
    locale: "en_KE",
    type: "website",
    images: [
      {
        url: "https://oreeti.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Oreeti — The room, activated.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oreeti — The room, activated.",
    description: "The live event activation platform for East Africa.",
    images: ["https://oreeti.com/og-image.png"],
  },
};

export default function Page() {
  return <HomeClient />;
}
