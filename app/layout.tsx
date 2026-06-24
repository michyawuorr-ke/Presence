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
  description: "Oreeti is the live event activation platform for professional connection. HMAC-signed QR check-in, M-Pesa ticketing, and consent-first networking — built for East Africa.",
  keywords: ["event networking", "event technology", "M-Pesa ticketing", "Nairobi events", "professional networking", "live events Africa"],
  openGraph: {
    title: "Oreeti — The room, activated.",
    description: "The infrastructure for meaningful connection at real-world events.",
    url: "https://oreeti.com",
    siteName: "Oreeti",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Oreeti — The room, activated.",
    description: "The infrastructure for meaningful connection at real-world events.",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://oreeti.com"),
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
