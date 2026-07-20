/** @type {import('next').Config} */
const nextConfig = {
  reactStrictMode: true,

  // Compress responses — critical for mobile on Kenyan networks
  compress: true,

  // Cache static assets aggressively; API routes stay dynamic
  async headers() {
    return [
      {
        // Static JS/CSS/fonts — cache for 1 year (fingerprinted filenames change on deploy)
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Images — cache for 7 days
        source: "/:path*.{jpg,jpeg,png,webp,svg,gif,ico}",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
      {
        // HTML pages — short cache, always revalidate (so updates deploy instantly)
        source: "/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          // Security headers
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // Image optimisation — serve WebP/AVIF automatically
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  // Reduce bundle size
  experimental: {
    optimizePackageImports: ["@tanstack/react-query", "lucide-react"],
  },
};

module.exports = nextConfig;
