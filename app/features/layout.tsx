import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Features | Oreeti",
  description: "QR networking handshakes, M-Pesa ticketing, consent-first connections, and real-time event intelligence — every layer of the Oreeti platform.",
  alternates: { canonical: "https://oreeti.com/features" },
  openGraph: {
    title: "Oreeti Features — The Complete Event Platform",
    description: "Everything you need to run a connected, professional event.",
    url: "https://oreeti.com/features",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Oreeti" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oreeti Features — The Complete Event Platform",
    description: "Everything you need to run a connected, professional event.",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
