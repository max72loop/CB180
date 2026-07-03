// app/sitemap.ts
// Plan du site pour l'indexation (pages statiques + fiches carte générées).

import type { MetadataRoute } from "next";
import { publicCards } from "@/lib/cards";
import { comparisonSlug } from "@/lib/card-display";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cb180.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/cartes",
    "/simulateur",
    "/comment-ca-marche",
    "/mentions-legales",
    "/confidentialite",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE}${path}`,
    changeFrequency: path === "" || path === "/cartes" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/simulateur" ? 0.9 : 0.7,
  }));

  const pub = publicCards();

  const cardEntries: MetadataRoute.Sitemap = pub.map((card) => ({
    url: `${SITE}/cartes/${card.id}`,
    lastModified: card.last_verified ?? undefined,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Toutes les paires canoniques de comparaison (longue traîne SEO).
  const comparisonEntries: MetadataRoute.Sitemap = [];
  for (let i = 0; i < pub.length; i++) {
    for (let j = i + 1; j < pub.length; j++) {
      comparisonEntries.push({
        url: `${SITE}/comparatif/${comparisonSlug(pub[i].id, pub[j].id)}`,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  return [...staticEntries, ...cardEntries, ...comparisonEntries];
}
