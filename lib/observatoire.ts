// lib/observatoire.ts
// Lecture de l'indice tarifaire de l'Observatoire CB180. Les relevés sont
// calculés hors ligne par scripts/snapshot-observatoire.mjs et versionnés dans
// data/observatoire-history.json ; ce module se contente de les charger, de les
// ordonner et de calculer les évolutions entre deux relevés. Aucun calcul
// d'agrégat ici : le chiffre publié est celui, daté, du dernier relevé.

import historyData from "../data/observatoire-history.json";

export interface CardFee {
  id: string;
  name: string;
  issuer: string;
  annualFee: number;
  fxFee: number;
}

export interface TierStat {
  tier: string;
  label: string;
  count: number;
  avgFee: number;
}

export interface CardRef {
  id: string;
  name: string;
  issuer: string;
  fee: number;
}

/** Un relevé trimestriel de l'indice. */
export interface Snapshot {
  period: string; // "2026-Q3"
  label: string; // "3ᵉ trimestre 2026"
  generatedAt: string; // date du relevé (ISO)
  referenceDate: string; // dernière vérification la plus récente du panel
  panelSize: number;
  avgAnnualFee: number;
  medianAnnualFee: number;
  minAnnualFee: number;
  maxAnnualFee: number;
  shareFree: number; // part de cartes sans cotisation (0..1)
  shareNoForeignFee: number; // part sans frais à l'étranger (0..1)
  avgFxFeePercent: number;
  byTier: TierStat[];
  cheapest: CardRef;
  mostExpensive: CardRef;
  cards: CardFee[];
}

/** Une évolution de cotisation détectée entre deux relevés. */
export interface FeeChange {
  id: string;
  name: string;
  issuer: string;
  from: number;
  to: number;
  delta: number;
  direction: "hausse" | "baisse";
}

export interface Evolution {
  feeChanges: FeeChange[];
  newCards: CardRef[];
  removedCards: { id: string; name: string; issuer: string }[];
}

const history = historyData as { snapshots: Snapshot[] };

/** Tous les relevés, du plus ancien au plus récent. */
export function getSnapshots(): Snapshot[] {
  return [...history.snapshots].sort((a, b) => a.period.localeCompare(b.period));
}

/** Dernier relevé publié (le chiffre de référence courant). */
export function latestSnapshot(): Snapshot | null {
  const all = getSnapshots();
  return all.at(-1) ?? null;
}

/**
 * Évolutions détectées entre les deux derniers relevés : hausses/baisses de
 * cotisation, cartes entrées et sorties du panel. Renvoie null s'il n'existe
 * qu'un seul relevé (série qui démarre : rien à comparer encore).
 */
export function latestEvolution(): Evolution | null {
  const all = getSnapshots();
  if (all.length < 2) return null;
  return diffSnapshots(all[all.length - 2], all[all.length - 1]);
}

/** Compare deux relevés carte par carte (appariées par id). */
export function diffSnapshots(prev: Snapshot, curr: Snapshot): Evolution {
  const prevById = new Map(prev.cards.map((c) => [c.id, c]));
  const currById = new Map(curr.cards.map((c) => [c.id, c]));

  const feeChanges: FeeChange[] = [];
  for (const c of curr.cards) {
    const before = prevById.get(c.id);
    if (!before || before.annualFee === c.annualFee) continue;
    const delta = Math.round((c.annualFee - before.annualFee) * 100) / 100;
    feeChanges.push({
      id: c.id,
      name: c.name,
      issuer: c.issuer,
      from: before.annualFee,
      to: c.annualFee,
      delta,
      direction: delta > 0 ? "hausse" : "baisse",
    });
  }
  // Hausses d'abord, puis par ampleur décroissante.
  feeChanges.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const newCards: CardRef[] = curr.cards
    .filter((c) => !prevById.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, issuer: c.issuer, fee: c.annualFee }));

  const removedCards = prev.cards
    .filter((c) => !currById.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, issuer: c.issuer }));

  return { feeChanges, newCards, removedCards };
}
