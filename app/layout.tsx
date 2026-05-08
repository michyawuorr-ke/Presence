import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Presence",
  description: "Your event, manifested.",
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
