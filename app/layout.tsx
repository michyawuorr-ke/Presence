import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Oreeti",
  description: "The simplest way to connect at real-world events.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{fontFamily:"var(--font-inter),-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
