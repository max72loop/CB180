// lib/card-badges.ts
// Badges « Best for » : signaux visuels du cas d'usage optimal d'une carte,
// DÉRIVÉS des champs vérifiés (aucune attribution manuelle, aucune dérive). Pur,
// sans dépendance React : réutilisable par la grille /cartes et les filtres.
//
// Discipline : descriptif, jamais prescriptif (IOBSP). Un badge affirme un FAIT
// vérifiable (« 0 % de frais à l'étranger + assurance voyage ») et son tooltip
// l'explique ; il ne dit pas « faite pour vous ». Chaque carte peut porter
// plusieurs badges éligibles, mais l'affichage se limite aux 2 premiers (ordre
// de priorité) pour ne pas surcharger.

import type { Card } from "./types";
import { formatEur } from "./format";

export type BadgeId = "travel" | "premium" | "cashback" | "student" | "free";

export interface Badge {
  id: BadgeId;
  /** Nom complet (aria-label, titre du tooltip). */
  label: string;
  /** Libellé court affiché sur le chip. */
  short: string;
  emoji: string;
  /** Couleur de fond distinctive (hex). */
  bg: string;
  /** Couleur de texte choisie pour rester lisible sur `bg` (contraste). */
  fg: string;
  /** Explication factuelle du pourquoi (tooltip + aria-label). */
  reason: string;
}

type BadgeStyle = Omit<Badge, "reason">;

/**
 * Style de chaque badge. Le texte n'est pas systématiquement blanc : sur les
 * fonds clairs (or, vert clair) un texte foncé est requis pour le contraste
 * (WCAG). La couleur de fond reste celle demandée par la charte.
 */
const STYLE: Record<BadgeId, BadgeStyle> = {
  travel: { id: "travel", label: "Meilleur pour voyager", short: "Voyage", emoji: "🌍", bg: "#0077B6", fg: "#ffffff" },
  premium: { id: "premium", label: "Premium", short: "Premium", emoji: "🏆", bg: "#DAA520", fg: "#1f2937" },
  cashback: { id: "cashback", label: "Meilleur cashback", short: "Cashback", emoji: "💸", bg: "#2E8B57", fg: "#ffffff" },
  student: { id: "student", label: "Idéal étudiant", short: "Étudiant", emoji: "🎓", bg: "#7B68EE", fg: "#ffffff" },
  free: { id: "free", label: "100 % gratuite", short: "Gratuite", emoji: "🆓", bg: "#90EE90", fg: "#14532d" },
};

/** Ordre de priorité : les 2 premiers badges éligibles d'une carte sont affichés. */
const PRIORITY: BadgeId[] = ["travel", "premium", "cashback", "student", "free"];

/** Retourne l'explication (raison) si la carte porte le badge, sinon null. */
const REASON: Record<BadgeId, (c: Card) => string | null> = {
  travel: (c) => {
    const withdrawalFee = c.foreign_withdrawal_fee_percent ?? 0;
    const travelInsurance =
      c.insurances_level === "premier_gold" || c.insurances_level === "elite";
    if (c.fx_fee_percent === 0 && withdrawalFee === 0 && travelInsurance) {
      return "0 % de frais de change, retraits hors zone euro sans frais et assurance voyage incluse.";
    }
    return null;
  },
  premium: (c) => {
    const topTier = c.tier === "premium" || c.tier === "haut_de_gamme";
    const topInsurance =
      c.insurances_level === "elite" || c.insurances_level === "premier_gold";
    if (topTier && c.annual_fee_eur > 150 && topInsurance) {
      return `Carte haut de gamme : cotisation ${formatEur(c.annual_fee_eur)}/an, assurances et services de niveau premium.`;
    }
    return null;
  },
  cashback: (c) => {
    const rate = c.cashback_rate_percent ?? 0;
    if (rate > 0) {
      return `Cashback d'environ ${rate.toString().replace(".", ",")} % sur les dépenses éligibles.`;
    }
    if (c.cashback) return `Remises / cashback : ${c.cashback}`;
    return null;
  },
  student: (c) => {
    if (c.annual_fee_eur < 30 && c.min_monthly_income_eur == null) {
      const fee = c.annual_fee_eur === 0 ? "Gratuite" : `${formatEur(c.annual_fee_eur)}/an`;
      return `${fee} et sans condition de revenu : accessible sans justificatif de salaire.`;
    }
    return null;
  },
  free: (c) => {
    if (c.annual_fee_eur === 0 && !c.monthly_fee_eur) {
      return "Cotisation 0 €, sans frais fixes.";
    }
    return null;
  },
};

/**
 * Tous les badges éligibles d'une carte, dans l'ordre de priorité. L'affichage
 * se limite aux 2 premiers (`.slice(0, 2)`) ; les filtres peuvent utiliser la
 * liste complète pour rester exacts même au-delà des 2 badges montrés.
 */
export function cardBadges(card: Card): Badge[] {
  const out: Badge[] = [];
  for (const id of PRIORITY) {
    const reason = REASON[id](card);
    if (reason) out.push({ ...STYLE[id], reason });
  }
  return out;
}

/** Métadonnées des badges pour les chips de filtre (sans carte). */
export const BADGE_FILTERS: BadgeStyle[] = PRIORITY.map((id) => STYLE[id]);
