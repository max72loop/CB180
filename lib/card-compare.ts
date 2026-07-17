// lib/card-compare.ts
// Couche PURE (sans React) du tableau comparatif. SOURCE UNIQUE des lignes et de
// la surbrillance pour les DEUX surfaces qui comparent des cartes :
//  · le modal côte à côte de /cartes (2 à 3 cartes, client) ;
//  · la page SEO /comparatif/[slug] (2 cartes, serveur).
// Les deux avaient leur propre jeu de lignes et leur propre logique de « meilleure
// valeur », qui divergeaient. Tout se définit désormais ici ; les composants ne
// font plus que du rendu (leurs designs, eux, restent volontairement distincts :
// modal dense et scrollable vs page SEO aérée).
//
// Deux principes :
//  · Honnêteté (IOBSP) : une ligne dont AUCUNE carte comparée n'a la donnée n'est
//    pas affichée (rowHasData). On ne fabrique pas de « — » partout. Les champs
//    non encore modélisés (plafond de paiement, note CB180) restent donc masqués
//    tant qu'ils ne sont pas renseignés, mais la ligne existe déjà (évolutif).
//  · Surbrillance objective : chaque ligne comparable expose un `score` (plus BAS
//    = meilleur) ; la meilleure valeur n'est mise en avant que s'il y a une vraie
//    différence entre les cartes (bestIndices).

import type { Card } from "./types";
import {
  INSURANCE_LABEL,
  feeLabel,
  fxLabel,
  incomeLabel,
  welcomeLabel,
} from "./card-display";
import {
  FEATURE_GROUPS,
  FEATURE_LABEL,
  debitLabel,
  featureCompareValue,
  materialLabel,
} from "./card-features";

/** Valeur d'une cellule : texte, ou null si la carte ne renseigne pas la donnée. */
export type CompareCell = string | null;

/** Descripteur d'une ligne du tableau comparatif. */
export interface CompareRow {
  id: string;
  label: string;
  /** Valeur d'une carte pour cette ligne (null = non renseigné). */
  value: (card: Card) => CompareCell;
  /** Score comparable (plus BAS = mieux), ou null si non comparable / inconnu. */
  score?: (card: Card) => number | null;
  /**
   * Libellé du repère porté par la meilleure valeur. Propre à chaque ligne : un
   * score bas ne veut pas dire « moins cher » partout (pour la condition de
   * revenu, il veut dire « plus accessible »). Wording IOBSP : on qualifie le
   * poste comparé, jamais la carte.
   */
  bestLabel?: string;
}

/**
 * Score proxy du retrait hors zone euro (plus bas = mieux) : gratuit si retraits
 * illimités, sinon somme % + fixe si l'un des deux est renseigné, sinon inconnu.
 */
export function withdrawalScore(card: Card): number | null {
  const freeFw = card.free_foreign_withdrawals_per_month ?? 0;
  const pct = card.foreign_withdrawal_fee_percent;
  const flat = card.foreign_withdrawal_flat_eur;
  if (freeFw >= 100) return 0;
  if (pct == null && flat == null) return null;
  return (pct ?? 0) + (flat ?? 0);
}

/**
 * Lignes « coût & conditions », dans l'ordre d'affichage.
 *
 * Cashback, assurances, miles et prime sont QUATRE lignes distinctes, et non un
 * bloc « avantages » agrégé : sur un tableau, des lignes alignées se comparent,
 * une liste à puces non. C'est aussi ce qui permet aux deux surfaces de partager
 * le même jeu de lignes (la page ne montrait ni cashback ni miles).
 */
export const COMPARE_ROWS: CompareRow[] = [
  { id: "network", label: "Réseau", value: (c) => c.network },
  {
    id: "fee",
    label: "Cotisation annuelle",
    value: (c) => feeLabel(c),
    score: (c) => c.annual_fee_eur,
    bestLabel: "moins cher",
  },
  {
    id: "fx",
    label: "Frais de change (hors zone euro)",
    value: (c) => fxLabel(c),
    score: (c) => c.fx_fee_percent,
    bestLabel: "moins cher",
  },
  {
    id: "withdrawal",
    label: "Retrait DAB hors zone euro",
    value: (c) => c.foreign_withdrawal,
    score: withdrawalScore,
    bestLabel: "moins cher",
  },
  // Non modélisé aujourd'hui → toujours null, donc masqué (ligne évolutive).
  { id: "ceiling", label: "Plafond de paiement", value: () => null },
  {
    id: "income",
    label: "Condition de revenu",
    value: (c) => incomeLabel(c),
    score: (c) => c.min_monthly_income_eur ?? 0,
    bestLabel: "plus accessible",
  },
  { id: "cashback", label: "Cashback", value: (c) => c.cashback },
  {
    id: "insurances",
    label: "Assurances / assistance",
    value: (c) => INSURANCE_LABEL[c.insurances_level],
  },
  { id: "miles", label: "Programme de miles", value: (c) => c.miles_program },
  { id: "welcome", label: "Prime de bienvenue", value: (c) => welcomeLabel(c) },
  // Non modélisée aujourd'hui → toujours null, donc masquée (ligne évolutive).
  { id: "rating", label: "Note CB180", value: () => null },
];

/**
 * Lignes « Fonctionnalités & services », dérivées de la taxonomie card-features
 * (débit et matière, puis les booléennes des groupes). Séparées de COMPARE_ROWS
 * pour que les surfaces puissent les regrouper sous leur propre intertitre.
 */
export const FEATURE_COMPARE_ROWS: CompareRow[] = [
  { id: "debitType", label: "Mode de débit", value: debitLabel },
  { id: "cardMaterial", label: "Matière de la carte", value: materialLabel },
  ...FEATURE_GROUPS.flatMap((group) =>
    group.keys.map(
      (key): CompareRow => ({
        id: key,
        label: FEATURE_LABEL[key],
        value: (c) => featureCompareValue(c, key),
      }),
    ),
  ),
];

/** True si au moins une carte comparée renseigne la ligne (sinon on la masque). */
export function rowHasData(row: CompareRow, cards: Card[]): boolean {
  return cards.some((c) => row.value(c) != null);
}

/**
 * Indices des cartes portant la MEILLEURE valeur d'une ligne (score minimal),
 * pour la surbrillance. Vide s'il n'y a pas de score, moins de deux valeurs
 * comparables, ou aucune différence réelle (toutes égales) : on ne met alors
 * rien en avant.
 */
export function bestIndices(row: CompareRow, cards: Card[]): Set<number> {
  const empty = new Set<number>();
  if (!row.score) return empty;
  const scores = cards.map((c) => row.score!(c));
  const valid = scores.filter((s): s is number => s != null);
  if (valid.length < 2) return empty;
  const min = Math.min(...valid);
  if (valid.every((v) => v === min)) return empty;
  const out = new Set<number>();
  scores.forEach((s, i) => {
    if (s === min) out.add(i);
  });
  return out;
}
