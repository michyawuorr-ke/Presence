import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import QueryProvider from "./providers/QueryProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Oreeti — The room, activated.",
    template: "%s | Oreeti",
  },
  description: "Oreeti is the live event activation platform for East Africa. QR-based networking handshakes, M-Pesa ticketing, consent-first connections, and real-time event intelligence.",
  keywords: [
    "event networking Kenya",
    "event technology Nairobi",
    "M-Pesa event ticketing",
    "professional networking events",
    "live event platform East Africa",
    "event check-in app Kenya",
    "Oreeti",
  ],
  metadataBase: new URL("https://oreeti.com"),
  alternates: { canonical: "https://oreeti.com" },
  openGraph: {
    title: "Oreeti — The room, activated.",
    description: "The live event activation platform for East Africa.",
    url: "https://oreeti.com",
    siteName: "Oreeti",
    locale: "en_KE",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Oreeti" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oreeti — The room, activated.",
    description: "The live event activation platform for East Africa.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  // Google Search Console verification
  verification: {
    google: "igIlZdAPLw13t5GVTWKu1lLzLqQ_ciMLpC4zAuTE2es",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Oreeti",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "url": "https://oreeti.com",
  "description": "Live event activation platform for East Africa — QR networking, M-Pesa ticketing, consent-first connections.",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KES" },
  "areaServed": { "@type": "Place", "name": "East Africa" },
  "author": { "@type": "Organization", "name": "Oreeti", "url": "https://oreeti.com" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-5H5ZQC9P');` }} />
        {/* End Google Tag Manager */}

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body style={{ fontFamily: "var(--font-inter),-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: "#0a0a0c", color: "#EAE6DF" }}>
        {/* Google Tag Manager (noscript) */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5H5ZQC9P" height="0" width="0" style={{ display: "none", visibility: "hidden" }}></iframe></noscript>
        {/* End Google Tag Manager (noscript) */}
        <QueryProvider>{children}</QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
