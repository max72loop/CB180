// lib/card-compare.ts
// Couche PURE (sans React) du comparateur côte à côte de /cartes. Transforme une
// Card en données d'affichage comparables et définit les LIGNES du tableau.
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

/** Données d'une carte prêtes à comparer, pré-calculées côté serveur. */
export interface CardCompareData {
  id: string;
  name: string;
  network: string;
  /** Cotisation : texte lisible + score (€/an, plus bas = mieux). */
  feeText: string;
  feeScore: number;
  /** Frais de change hors zone euro : texte + score (%, plus bas = mieux). */
  fxText: string;
  fxScore: number;
  /** Retrait DAB hors zone euro : texte libre + score proxy (null si inconnu). */
  withdrawalText: string;
  withdrawalScore: number | null;
  /** Condition de revenu : texte + score (€/mois requis, 0 = sans condition). */
  incomeText: string;
  incomeScore: number;
  /** Avantages principaux (cashback, assurances, miles, prime), liste courte. */
  perks: string[];
  /** Plafond de paiement : non modélisé aujourd'hui → null (ligne masquée). */
  ceilingText: string | null;
  /** Note CB180 : non modélisée aujourd'hui → null (ligne masquée). */
  ratingText: string | null;
}

/** Construit les données comparables d'une carte à partir de champs vérifiés. */
export function buildCompareData(card: Card): CardCompareData {
  const perks: string[] = [];
  if (card.cashback) perks.push(`Cashback : ${card.cashback}`);
  if (card.insurances_level !== "none") perks.push(INSURANCE_LABEL[card.insurances_level]);
  if (card.miles_program) perks.push(`Miles : ${card.miles_program}`);
  if (card.welcome_bonus_eur > 0) perks.push(welcomeLabel(card));

  // Score proxy du retrait étranger (plus bas = mieux) : gratuit si retraits
  // illimités, sinon somme % + fixe si l'un des deux est renseigné, sinon inconnu.
  const freeFw = card.free_foreign_withdrawals_per_month ?? 0;
  const pct = card.foreign_withdrawal_fee_percent;
  const flat = card.foreign_withdrawal_flat_eur;
  let withdrawalScore: number | null;
  if (freeFw >= 100) withdrawalScore = 0;
  else if (pct == null && flat == null) withdrawalScore = null;
  else withdrawalScore = (pct ?? 0) + (flat ?? 0);

  return {
    id: card.id,
    name: card.name,
    network: card.network,
    feeText: feeLabel(card),
    feeScore: card.annual_fee_eur,
    fxText: fxLabel(card),
    fxScore: card.fx_fee_percent,
    withdrawalText: card.foreign_withdrawal,
    withdrawalScore,
    incomeText: incomeLabel(card),
    incomeScore: card.min_monthly_income_eur ?? 0,
    perks,
    ceilingText: null,
    ratingText: null,
  };
}

/** Rendu d'une cellule : soit une valeur simple, soit une liste (avantages). */
export type CompareCell = string | string[] | null;

/** Descripteur d'une ligne du tableau comparatif. */
export interface CompareRow {
  id: string;
  label: string;
  /** Valeur d'une carte pour cette ligne (null = non renseigné). */
  value: (d: CardCompareData) => CompareCell;
  /** Score comparable (plus BAS = mieux), ou null si non comparable / inconnu. */
  score?: (d: CardCompareData) => number | null;
}

/** Lignes du tableau, dans l'ordre d'affichage. Le nom sert d'en-tête de colonne. */
export const COMPARE_ROWS: CompareRow[] = [
  { id: "network", label: "Réseau", value: (d) => d.network },
  {
    id: "fee",
    label: "Cotisation annuelle",
    value: (d) => d.feeText,
    score: (d) => d.feeScore,
  },
  {
    id: "fx",
    label: "Frais hors zone euro (change)",
    value: (d) => d.fxText,
    score: (d) => d.fxScore,
  },
  {
    id: "withdrawal",
    label: "Retrait DAB hors zone euro",
    value: (d) => d.withdrawalText,
    score: (d) => d.withdrawalScore,
  },
  { id: "ceiling", label: "Plafond de paiement", value: (d) => d.ceilingText },
  {
    id: "income",
    label: "Conditions de revenu",
    value: (d) => d.incomeText,
    score: (d) => d.incomeScore,
  },
  {
    id: "perks",
    label: "Avantages principaux",
    value: (d) => (d.perks.length > 0 ? d.perks : null),
  },
  { id: "rating", label: "Note CB180", value: (d) => d.ratingText },
];

/** True si au moins une carte comparée renseigne la ligne (sinon on la masque). */
export function rowHasData(row: CompareRow, cards: CardCompareData[]): boolean {
  return cards.some((c) => {
    const v = row.value(c);
    return Array.isArray(v) ? v.length > 0 : v != null;
  });
}

/**
 * Indices des cartes portant la MEILLEURE valeur d'une ligne (score minimal),
 * pour la surbrillance. Vide s'il n'y a pas de score, moins de deux valeurs
 * comparables, ou aucune différence réelle (toutes égales) : on ne met alors
 * rien en avant.
 */
export function bestIndices(row: CompareRow, cards: CardCompareData[]): Set<number> {
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
