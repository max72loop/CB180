// lib/scenarios.ts
// Profils d'usage REPRÉSENTATIFS et déterministes, servant à chiffrer le
// « coût réel » d'une carte selon quelques cas types (SSG, indexable) et à
// alimenter le widget de simulation embarqué sur la fiche carte.
//
// Wording IOBSP : ce sont des SCÉNARIOS D'USAGE explicites, pas des profils
// « recommandés ». On chiffre un fait (le coût annuel estimé) pour un usage
// donné ; on ne dit jamais « cette carte est faite pour vous ».

import type { UsageProfile } from "./types";

/**
 * Valeurs par défaut d'un profil : usage domestique modeste, sans devises ni
 * voyage. `buildProfile` les surcharge champ par champ. Alignées sur les
 * fourchettes du questionnaire (lib/answers.ts) pour rester cohérentes.
 */
const BASE_PROFILE: UsageProfile = {
  monthlySpendingEur: 1000,
  foreignSpendingShare: 0,
  travelOutsideEuropePerYear: 0,
  foreignWithdrawalsPerMonth: 0,
  currentAnnualFeeEur: 0,
  valuesRewards: false,
  monthlyIncomeEur: 2150,
  profileType: "autre",
};

/** Construit un profil complet à partir d'une surcharge partielle. */
export function buildProfile(partial: Partial<UsageProfile>): UsageProfile {
  return { ...BASE_PROFILE, ...partial };
}

export interface UsageScenario {
  /** Slug stable (analytics / ancres). */
  id: string;
  /** Titre court affiché (ex. « Sédentaire »). */
  label: string;
  /** Description lisible de l'usage chiffré (une phrase). */
  description: string;
  profile: UsageProfile;
}

/**
 * Trois scénarios d'usage contrastés, du plus casanier au grand voyageur.
 * Choisis pour que la SENSIBILITÉ du coût aux frais de change/retrait soit
 * visible : une carte à 0 % de change coûte pareil dans les trois ; une carte
 * à change élevé décroche nettement sur les scénarios « en devises ».
 */
export const USAGE_SCENARIOS: UsageScenario[] = [
  {
    id: "sedentaire",
    label: "Sédentaire",
    description: "1 000 €/mois de dépenses, quasiment aucune en devises, aucun retrait à l'étranger.",
    profile: buildProfile({
      monthlySpendingEur: 1000,
      foreignSpendingShare: 0.02,
      profileType: "petit_budget_sedentaire",
    }),
  },
  {
    id: "voyageur-occasionnel",
    label: "Voyageur occasionnel",
    description: "1 500 €/mois dont 10 % en devises, 2 voyages hors Europe par an, retraits rares.",
    profile: buildProfile({
      monthlySpendingEur: 1500,
      foreignSpendingShare: 0.1,
      travelOutsideEuropePerYear: 2,
      foreignWithdrawalsPerMonth: 0.5,
      profileType: "voyageur_regulier",
    }),
  },
  {
    id: "grand-voyageur",
    label: "Grand voyageur",
    description: "2 750 €/mois dont 40 % en devises, 5 voyages hors Europe par an, 2 retraits/mois.",
    profile: buildProfile({
      monthlySpendingEur: 2750,
      foreignSpendingShare: 0.4,
      travelOutsideEuropePerYear: 5,
      foreignWithdrawalsPerMonth: 2,
      monthlyIncomeEur: 3250,
      profileType: "voyageur_regulier",
    }),
  },
];

/** Options du widget embarqué : dépenses mensuelles (fourchette → valeur). */
export const WIDGET_SPENDING = [
  { id: "s2", label: "750 €", value: 750 },
  { id: "s3", label: "1 500 €", value: 1500 },
  { id: "s4", label: "2 750 €", value: 2750 },
  { id: "s5", label: "4 500 €", value: 4500 },
] as const;

/** Options du widget embarqué : part des dépenses hors zone euro. */
export const WIDGET_FOREIGN_SHARE = [
  { id: "f1", label: "Presque rien", value: 0.02 },
  { id: "f2", label: "~10 %", value: 0.1 },
  { id: "f3", label: "~25 %", value: 0.22 },
  { id: "f5", label: "~50 %+", value: 0.5 },
] as const;

/** Options du widget embarqué : cotisation actuellement payée par l'utilisateur. */
export const WIDGET_CURRENT_FEE = [
  { id: "c1", label: "0 €", value: 0 },
  { id: "c3", label: "~75 €", value: 75 },
  { id: "c4", label: "~130 €", value: 130 },
  { id: "c5", label: "180 €+", value: 180 },
] as const;
