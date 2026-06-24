import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/features", "/organizers", "/attendees", "/faq", "/privacy", "/terms"],
        disallow: ["/dashboard/", "/api/", "/auth/", "/e/", "/register/"],
      },
    ],
    sitemap: "https://oreeti.com/sitemap.xml",
  };
}
