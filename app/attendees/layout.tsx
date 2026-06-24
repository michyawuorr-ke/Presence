import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = { title: "For Attendees", description: "Connect without the chase. Oreeti gives you a professional presence at the event and full control over who sees it, when.", openGraph: { title: "Oreeti for Attendees", description: "You control what the room knows about you." } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
