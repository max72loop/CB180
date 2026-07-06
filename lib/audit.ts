// lib/audit.ts
// Passerelle réponses → enregistrement anonymisé. CLIENT-SAFE : aucun import
// de @libsql/client ni de `crypto`, pour rester utilisable dans un composant
// client sans embarquer le driver serveur dans le bundle.
//
// Les types AuditProfile / AuditResult sont définis ICI et réutilisés par
// lib/db.ts (server-only).

import { selectedBand, type Answers } from "./answers";
import type { CostBreakdown, RankedCard } from "./types";

/** Profil anonymisé stocké en base : uniquement des fourchettes. */
export interface AuditProfile {
  spend_band: string;
  foreign_share: string;
  travel_freq: string;
  foreign_withdraw: string;
  current_fee_band: string;
  reward_pref: string;
  income_band: string;
  profile_type: string;
}

/** Résultat calculé (côté client), stocké pour l'analyse agrégée. */
export interface AuditResult {
  top_card_id: string;
  current_annual_cost: number;
  best_annual_gain: number;
}

/**
 * Construit le profil anonymisé (fourchettes) à partir des réponses.
 *
 * Les colonnes `travel_freq` et `profile_type` restent au schéma de la base
 * (aucune migration) mais ne sont plus demandées à l'utilisateur : on y écrit un
 * sentinel explicite « non_demande » pour distinguer ce cas d'une réponse vide.
 */
export function answersToAuditProfile(answers: Answers): AuditProfile {
  return {
    spend_band: selectedBand("monthlySpending", answers),
    foreign_share: selectedBand("foreignShare", answers),
    travel_freq: "non_demande",
    foreign_withdraw: selectedBand("foreignWithdrawals", answers),
    current_fee_band: selectedBand("currentFee", answers),
    reward_pref: selectedBand("rewardsInterest", answers),
    income_band: selectedBand("income", answers),
    profile_type: "non_demande",
  };
}

/** Extrait le résultat à stocker à partir du calcul moteur. */
export function buildAuditResult(
  current: CostBreakdown,
  ranked: RankedCard[],
): AuditResult {
  const top = ranked[0];
  return {
    top_card_id: top?.card.id ?? "",
    current_annual_cost: current.netAnnualCostEur,
    best_annual_gain: top ? top.savingsVsCurrentEur : 0,
  };
}
