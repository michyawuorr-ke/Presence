import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "For Organizers | Oreeti",
  description: "Host events that actually connect people. M-Pesa ticketing, QR networking, real-time dashboards and check-in — built for any live event in East Africa.",
  alternates: { canonical: "https://oreeti.com/organizers" },
  openGraph: {
    title: "Oreeti for Organizers — Host Better Events",
    description: "The event platform built for organizers who care about connection, not just attendance.",
    url: "https://oreeti.com/organizers",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Oreeti" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oreeti for Organizers — Host Better Events",
    description: "The event platform built for organizers who care about connection, not just attendance.",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
