import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
