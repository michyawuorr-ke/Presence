import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://oreeti.com";
  const now = new Date();

  return [
    { url: base,                    lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/about`,         lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/features`,      lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/organizers`,    lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/attendees`,     lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/faq`,           lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`,       lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${base}/terms`,         lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
  ];
}
