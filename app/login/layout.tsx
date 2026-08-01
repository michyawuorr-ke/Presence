import type { Metadata } from "next";

// /login is a bare auth form (Create Account / Sign In) with no standalone
// content — someone landing here from a search result with no context
// about what they're signing up for is a worse experience than landing on
// the real homepage first. Excluded from the sitemap too (see app/sitemap.ts).
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
