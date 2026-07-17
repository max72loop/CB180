// app/sitemap.ts
// Plan du site pour l'indexation (pages statiques + fiches carte générées).

import type { MetadataRoute } from "next";
import { publicCards } from "@/lib/cards";
import { comparisonPairs } from "@/lib/card-display";
import { GUIDES } from "@/lib/guides";
import { BANKS } from "@/lib/banks";
import { PROFILS } from "@/lib/profils";
import { SITE_URL } from "@/lib/site";

const SITE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/cartes",
    "/guides",
    "/banques",
    "/profils",
    "/observatoire",
    "/simulateur",
    "/comment-ca-marche",
    "/mentions-legales",
    "/confidentialite",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE}${path}`,
    changeFrequency:
      path === "" || path === "/cartes" || path === "/guides"
        ? "weekly"
        : "monthly",
    priority: path === "" ? 1 : path === "/simulateur" ? 0.9 : 0.7,
  }));

  const guideEntries: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${SITE}/guides/${g.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const bankEntries: MetadataRoute.Sitemap = BANKS.map((b) => ({
    url: `${SITE}/banques/${b.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Landing pages par profil (intentions d'achat contextuelles : PVT, expat…).
  const profilEntries: MetadataRoute.Sitemap = PROFILS.map((p) => ({
    url: `${SITE}/profils/${p.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const pub = publicCards();

  const cardEntries: MetadataRoute.Sitemap = pub.map((card) => ({
    url: `${SITE}/cartes/${card.id}`,
    lastModified: card.last_verified ?? undefined,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Comparatifs : on ne soumet QUE les paires réellement maillées depuis les
  // fiches (cf. comparisonPairs). Soumettre les n(n-1)/2 paires noyait le site
  // sous ~900 URLs sans lien interne — 92 % du sitemap pour un contenu quasi
  // dupliqué, au détriment du budget de crawl des pages qui comptent.
  const comparisonEntries: MetadataRoute.Sitemap = comparisonPairs(pub).map((slug) => ({
    url: `${SITE}/comparatif/${slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [
    ...staticEntries,
    ...guideEntries,
    ...bankEntries,
    ...profilEntries,
    ...cardEntries,
    ...comparisonEntries,
  ];
}
