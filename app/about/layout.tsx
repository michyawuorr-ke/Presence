import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "About Oreeti",
  description: "Built in Nairobi because the room was too quiet. The story behind Oreeti — the live event activation platform for East Africa.",
  alternates: { canonical: "https://oreeti.com/about" },
  openGraph: {
    title: "About Oreeti — Built in Nairobi",
    description: "Built because professional events in East Africa deserved better infrastructure.",
    url: "https://oreeti.com/about",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Oreeti" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Oreeti — Built in Nairobi",
    description: "Built because professional events in East Africa deserved better infrastructure.",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
