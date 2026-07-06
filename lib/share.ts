// lib/share.ts
// Encodage/décodage du lien de partage viral (chantier 05). Le slug de la route
// /partage transporte le montant d'économie ET, optionnellement, la décomposition
// du coût actuel (cotisation / change / retrait) pour que l'image Open Graph
// puisse dessiner le radar de coût côté récepteur.
//
// Contrainte Next.js : les fichiers opengraph-image ne reçoivent que les `params`
// de route, jamais les `searchParams`. La compo est donc encodée dans le CHEMIN
// (`/partage/269-120-80-40`) plutôt qu'en query string. Le format reste
// rétro-compatible : un lien « montant seul » historique (`/partage/269`) parse
// toujours, sans compo.

import { costComposition } from "@/lib/engine";
import type { CostBreakdown } from "@/lib/types";

/** Décomposition du coût actuel, en euros entiers, transportée dans le lien. */
export interface ShareCompo {
  cotisation: number;
  change: number;
  retrait: number;
}

export interface ShareData {
  /** Économie annuelle estimée (euros entiers), ou null si le slug est neutre. */
  amount: number | null;
  /** Décomposition du coût actuel, si le lien la transporte (sinon null). */
  compo: ShareCompo | null;
}

// Mêmes bornes que l'ancienne page : montant crédible, postes plafonnés pour
// éviter des URLs absurdes ou des radars déformés par une valeur aberrante.
const MAX_AMOUNT = 3000;
const MAX_POST = 5000;

/** Entier ≥ 0 borné à `max`, ou null si non parsable. */
function parseBoundedInt(raw: string | undefined, max: number): number | null {
  if (raw == null) return null;
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  return n;
}

/** Décompose un coût en triplet d'euros entiers prêt pour le partage. */
export function shareCompoFromBreakdown(breakdown: CostBreakdown): ShareCompo {
  const byPost = new Map(
    costComposition(breakdown).map((p) => [p.post, p.amountEur] as const),
  );
  return {
    cotisation: Math.max(0, Math.round(byPost.get("cotisation") ?? 0)),
    change: Math.max(0, Math.round(byPost.get("change") ?? 0)),
    retrait: Math.max(0, Math.round(byPost.get("retrait") ?? 0)),
  };
}

/** Construit le slug `/partage/<slug>` à partir de l'économie et de la compo. */
export function buildShareSlug(gainEur: number, compo?: ShareCompo | null): string {
  const amount = Math.round(gainEur);
  if (!compo) return String(amount);
  const c = Math.max(0, Math.round(compo.cotisation));
  const x = Math.max(0, Math.round(compo.change));
  const r = Math.max(0, Math.round(compo.retrait));
  // Tous les postes nuls : rien à dessiner, on retombe sur le lien montant seul.
  if (c + x + r <= 0) return String(amount);
  return `${amount}-${c}-${x}-${r}`;
}

/** Parse le slug `/partage/<slug>`. Rétro-compatible avec les liens historiques. */
export function parseShareSlug(raw: string): ShareData {
  const parts = raw.split("-");
  const amount = parseBoundedInt(parts[0], MAX_AMOUNT);
  // Montant absent ou nul : slug neutre (la page affiche une accroche générique).
  if (amount == null || amount <= 0) return { amount: null, compo: null };
  if (parts.length < 4) return { amount, compo: null };

  const cotisation = parseBoundedInt(parts[1], MAX_POST);
  const change = parseBoundedInt(parts[2], MAX_POST);
  const retrait = parseBoundedInt(parts[3], MAX_POST);
  if (cotisation == null || change == null || retrait == null) {
    return { amount, compo: null };
  }
  if (cotisation + change + retrait <= 0) return { amount, compo: null };
  return { amount, compo: { cotisation, change, retrait } };
}
