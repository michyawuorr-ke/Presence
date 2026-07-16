import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "For Attendees | Oreeti",
  description: "Connect without the chase. Oreeti gives you a professional presence at events and full control over who sees it, when.",
  alternates: { canonical: "https://oreeti.com/attendees" },
  openGraph: {
    title: "Oreeti for Attendees — You Control the Room",
    description: "Professional event networking in East Africa — on your terms.",
    url: "https://oreeti.com/attendees",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Oreeti" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oreeti for Attendees — You Control the Room",
    description: "Professional event networking in East Africa — on your terms.",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
