// lib/profils.ts
// Registre des PROFILS de landing pages (voyageur longue durée : PVT, expat,
// étudiant en échange…). Chaque entrée décrit une intention contextuelle à
// forte valeur d'achat et fournit un jeu de réponses PRÉ-REMPLI injecté dans le
// simulateur (mêmes ids d'option que lib/answers → même moteur, mêmes chiffres).
//
// Une page profil = une entrée ici. Aucun chiffre n'est codé en dur : l'écart
// annuel affiché est calculé en direct par le moteur à partir de `answers`.

import type { Answers } from "./answers";

export interface ProfilLanding {
  /** Slug d'URL : /profils/<slug>. */
  slug: string;
  /** Titre H1 marketing (requête à intention d'achat). */
  h1: string;
  /** Accroche affichée sous le titre. */
  intro: string;
  /**
   * Hypothèses retenues, énoncées EN CLAIR sous le résultat (transparence : le
   * chiffre est une estimation sur ces hypothèses, que l'utilisateur peut
   * affiner). Chaque ligne décrit une réponse pré-remplie.
   */
  hypotheses: string[];
  /** Réponses pré-remplies (ids d'option de lib/answers), profil complet. */
  answers: Answers;
  /** Métadonnées SEO / partage social. */
  seo: { title: string; description: string };
}

export const PROFILS: ProfilLanding[] = [
  {
    slug: "pvt-australie",
    h1: "PVT Australie : combien votre carte bancaire va vous coûter en un an",
    intro:
      "Douze mois de dépenses en dollars australiens avec une carte française classique, ce sont des frais de change et de retrait qui s'accumulent en silence. Voici l'estimation, sur un profil PVT réaliste — et ce que vous pourriez récupérer.",
    hypotheses: [
      "Environ 1 000 à 2 000 € de dépenses par mois sur place",
      "La grande majorité de ces dépenses en devises (dollars australiens)",
      "1 à 3 retraits au distributeur par mois",
      "Une carte actuelle de réseau classique à moins de 50 € par an",
    ],
    answers: {
      monthlySpending: "s3", // 1 000 à 2 000 €
      foreignShare: "f5", // Majoritairement (>50 %)
      currentFee: "c2", // Moins de 50 €
      foreignWithdrawals: "w3", // 1 à 3 par mois
      rewardsInterest: "r2", // Non, payer le moins possible
      income: "i2", // 1 200 à 1 800 €
    },
    seo: {
      title:
        "PVT Australie : le vrai coût de votre carte bancaire sur un an | CB180",
      description:
        "Combien une carte française vous coûte réellement pendant un PVT en Australie, frais de change et de retrait compris — et quelle carte évite ces frais. Estimation transparente, simulateur pré-rempli.",
    },
  },
];

/** Récupère un profil de landing par slug. */
export function getProfil(slug: string): ProfilLanding | undefined {
  return PROFILS.find((p) => p.slug === slug);
}
