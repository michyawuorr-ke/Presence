import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Built in Nairobi because the room was too quiet. The story behind Oreeti — the live event networking platform for East Africa.",
  openGraph: {
    title: "About Oreeti",
    description: "Built in Nairobi because the room was too quiet.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
