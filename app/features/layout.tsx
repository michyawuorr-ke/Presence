import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = { title: "Features", description: "Every layer of the Oreeti platform — rotating QR networking handshake, M-Pesa ticketing, consent-first networking, and post-event intelligence.", openGraph: { title: "Oreeti Features", description: "The complete infrastructure for live event activation." } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
