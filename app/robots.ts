// app/robots.ts
// Directives d'exploration + lien vers le plan du site.

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const SITE = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // API et liens de redirection affiliée : non indexables.
      disallow: ["/api/", "/go/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
