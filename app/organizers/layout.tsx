import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = { title: "For Organizers", description: "Host events that actually connect people. M-Pesa ticketing, magic link check-in, real-time dashboards, and post-event activation reports.", openGraph: { title: "Oreeti for Organizers", description: "The event you imagined, finally possible." } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
