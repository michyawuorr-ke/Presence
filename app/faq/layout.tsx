import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = { title: "FAQ", description: "Everything worth asking about Oreeti — pricing, how networking works, data privacy, and more.", openGraph: { title: "Oreeti FAQ", description: "Everything worth asking." } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
