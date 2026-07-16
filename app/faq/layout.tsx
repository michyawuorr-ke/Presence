import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "FAQ | Oreeti",
  description: "Everything worth asking about Oreeti — pricing, how networking works, data privacy, M-Pesa payments, and more.",
  alternates: { canonical: "https://oreeti.com/faq" },
  openGraph: {
    title: "Oreeti FAQ — Common Questions",
    description: "Answers about pricing, networking, privacy, and how Oreeti works.",
    url: "https://oreeti.com/faq",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Oreeti" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oreeti FAQ — Common Questions",
    description: "Answers about pricing, networking, privacy, and how Oreeti works.",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
