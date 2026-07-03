// app/robots.ts
// Directives d'exploration + lien vers le plan du site.

import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cb180.fr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Les routes d'API ne sont pas indexables.
      disallow: "/api/",
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
