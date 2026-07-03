// lib/card-display.ts
// Helpers d'AFFICHAGE des cartes (labels lisibles, formats). Pur, réutilisable
// par les pages SEO (/cartes) et les composants. Aucune dépendance à React.

import type { Card, CardTier, InsurancesLevel } from "./types";
import { formatEur } from "./format";

export type CardTone = "brand" | "dark" | "emerald" | "slate";

/** Teinte de la vignette selon la gamme (décoratif, neutre). */
export function toneForTier(tier: CardTier): CardTone {
  if (tier === "premium") return "dark";
  if (tier === "haut_de_gamme") return "emerald";
  if (tier === "intermediaire") return "brand";
  return "slate";
}

export const TIER_LABEL: Record<CardTier, string> = {
  entree: "Entrée de gamme",
  intermediaire: "Intermédiaire",
  premium: "Premium",
  haut_de_gamme: "Haut de gamme",
};

export const INSURANCE_LABEL: Record<InsurancesLevel, string> = {
  none: "Aucune assurance incluse",
  basique: "Assurances basiques",
  premier_gold: "Assurances niveau Premier / Gold",
  elite: "Assurances haut de gamme (élite)",
};

/** Cotisation lisible : « Gratuite » ou « 60 €/an (5 €/mois) ». */
export function feeLabel(card: Card): string {
  if (card.annual_fee_eur === 0) return "Gratuite";
  const annual = `${formatEur(card.annual_fee_eur)}/an`;
  if (card.monthly_fee_eur && card.monthly_fee_eur > 0) {
    return `${annual} (${formatEur(card.monthly_fee_eur)}/mois)`;
  }
  return annual;
}

/** Frais de change hors zone euro, ex. « 0 % » / « 2,80 % ». */
export function fxLabel(card: Card): string {
  return `${card.fx_fee_percent.toString().replace(".", ",")} %`;
}

/** Condition de revenu, ex. « ≥ 2 200 €/mois » / « Sans condition de revenu ». */
export function incomeLabel(card: Card): string {
  const min = card.min_monthly_income_eur;
  if (min == null) return "Sans condition de revenu";
  return `≥ ${formatEur(min)}/mois`;
}

/** Prime de bienvenue, ex. « 80 € (offre volatile) » / « Aucune prime confirmée ». */
export function welcomeLabel(card: Card): string {
  if (!card.welcome_bonus_eur || card.welcome_bonus_eur <= 0) {
    return "Aucune prime de base confirmée";
  }
  return `${formatEur(card.welcome_bonus_eur)} (offre volatile)`;
}

/**
 * Slug canonique d'une comparaison de deux cartes : ids triés + « -vs- »,
 * pour qu'une même paire n'ait qu'une seule URL (pas de doublon A-vs-B / B-vs-A).
 */
export function comparisonSlug(aId: string, bId: string): string {
  const [x, y] = [aId, bId].sort();
  return `${x}-vs-${y}`;
}

/** Extrait les deux ids d'un slug de comparaison, ou null si invalide. */
export function parseComparisonSlug(slug: string): [string, string] | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1] || parts[0] === parts[1]) {
    return null;
  }
  return [parts[0], parts[1]];
}

/** Date de vérification lisible « JJ/MM/AAAA » ou null si non vérifiée. */
export function verifiedDate(card: Card): string | null {
  const iso = card.last_verified;
  if (!iso || card.to_verify) return null;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return null;
  return `${d}/${m}/${y}`;
}
