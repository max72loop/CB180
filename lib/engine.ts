// lib/engine.ts
// Moteur de calcul CB180 — fonctions PURES, zéro dépendance à React.
//
// Rôle : à partir d'un profil d'usage normalisé, calculer le coût annuel net
// de chaque carte et produire un classement OBJECTIF trié par coût croissant,
// avec le détail chiffré de chaque calcul.
//
// Contrainte réglementaire (voir wording_iobsp.md) : le tri est explicable et
// objectif. Le moteur ne produit jamais de "recommandé pour vous".

import type {
  Card,
  CostBreakdown,
  CostShare,
  EngineAssumptions,
  RankedCard,
  UsageProfile,
} from "./types";

/**
 * Hypothèses par défaut, surchargées carte par appel.
 * - Prime amortie sur 3 ans (P1) : lisse une prime non récurrente pour ne pas
 *   laisser les grosses primes écraser le classement de profils qui ne voyagent
 *   pas et ne visent pas le bonus.
 * - Facteur de réalisme des récompenses 0,7 (P2) : points expirés/non utilisés.
 */
export const DEFAULT_ASSUMPTIONS: EngineAssumptions = {
  averageForeignWithdrawalEur: 100,
  welcomeBonusAmortizationYears: 3,
  rewardsRealizationFactor: 0.7,
};

/**
 * Situation actuelle "type" pour un utilisateur de banque de réseau.
 * Sert à chiffrer le coût de la situation actuelle : on ne demande jamais le
 * nom de la banque, on modélise un profil de frais traditionnel et on injecte
 * la cotisation réellement déclarée par l'utilisateur.
 */
export const DEFAULT_CURRENT_SITUATION = {
  /** Frais de change typiques d'une carte de réseau (Visa Premier / Gold). */
  fxFeePercent: 2.7,
  /** Retrait étranger typiquement facturé (%), au-delà d'aucun quota gratuit. */
  foreignWithdrawalFeePercent: 2.9,
  /** Part fixe typique par retrait étranger, en €. */
  foreignWithdrawalFlatEur: 3,
  /** Retraits étrangers gratuits par mois côté réseau traditionnel. */
  freeForeignWithdrawalsPerMonth: 0,
} as const;

/** Arrondi à 2 décimales (centimes) pour l'affichage/les comparaisons. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Priorité 3 — plancher de part hors zone euro suggéré par la fréquence de
 * voyage hors Europe. On ne corrige QUE vers le haut (prudence) : un voyageur
 * fréquent dépense rarement 0 en devises. Fiabilise le chiffre central.
 */
export function travelImpliedForeignShareFloor(travelPerYear: number): number {
  if (travelPerYear >= 6) return 0.2;
  if (travelPerYear >= 4) return 0.12;
  if (travelPerYear >= 2) return 0.06;
  return 0;
}

/**
 * Part hors euro EFFECTIVE = max(part déclarée, plancher impliqué par les
 * voyages). Jamais d'ajustement à la baisse (on ne sous-estime pas les frais).
 */
export function effectiveForeignShare(profile: UsageProfile): number {
  return clamp01(
    Math.max(
      profile.foreignSpendingShare,
      travelImpliedForeignShareFloor(profile.travelOutsideEuropePerYear),
    ),
  );
}

/** Frais de retrait étranger annuels selon un modèle par retrait. */
function foreignWithdrawalFee(
  withdrawalsPerYear: number,
  freePerYear: number,
  feePercent: number,
  flatEur: number,
  averageAmountEur: number,
): number {
  const billable = Math.max(0, withdrawalsPerYear - freePerYear);
  const perWithdrawal = flatEur + (feePercent / 100) * averageAmountEur;
  return billable * perWithdrawal;
}

/**
 * Coût annuel NET d'une carte pour un profil donné.
 *
 * net = cotisation annuelle
 *     + frais de change (fx_fee_percent × dépenses annuelles hors zone euro)
 *     + frais de retrait étranger estimés
 *     − valeur amortie du welcome bonus (sur `welcomeBonusAmortizationYears`)
 *     − valeur estimée du cashback
 *
 * Un coût net négatif signifie que la carte "rapporte" sur l'horizon considéré
 * (prime + cashback supérieurs aux frais). Le détail complet est renvoyé pour
 * la transparence.
 */
export function computeAnnualCost(
  card: Card,
  profile: UsageProfile,
  assumptions: EngineAssumptions = DEFAULT_ASSUMPTIONS,
): CostBreakdown {
  const annualSpending = profile.monthlySpendingEur * 12;
  // Priorité 3 : la fréquence de voyage peut relever (jamais baisser) la part
  // hors zone euro déclarée, pour fiabiliser le chiffre central.
  const foreignAnnualSpending = annualSpending * effectiveForeignShare(profile);
  const foreignWithdrawalsPerYear = profile.foreignWithdrawalsPerMonth * 12;

  // 1. Cotisation
  const annualFeeEur = card.annual_fee_eur;

  // 2. Frais de change sur les dépenses hors zone euro
  const fxFeeEur = (card.fx_fee_percent / 100) * foreignAnnualSpending;

  // 3. Frais de retrait étranger (P5 : montant moyen paramétrable)
  const foreignWithdrawalFeeEur = foreignWithdrawalFee(
    foreignWithdrawalsPerYear,
    (card.free_foreign_withdrawals_per_month ?? 0) * 12,
    card.foreign_withdrawal_fee_percent ?? 0,
    card.foreign_withdrawal_flat_eur ?? 0,
    assumptions.averageForeignWithdrawalEur,
  );

  // Somme des postes de COÛT avant déductions — sert au poids relatif (P6).
  const grossCostEur = annualFeeEur + fxFeeEur + foreignWithdrawalFeeEur;

  // 4. Prime de bienvenue amortie (déduite) — horizon 3 ans par défaut (P1)
  const years = Math.max(1, assumptions.welcomeBonusAmortizationYears);
  const welcomeBonusAmortizedEur = card.welcome_bonus_eur / years;

  // 5. Cashback estimé (déduit), plafonné
  const cashbackRate = card.cashback_rate_percent ?? 0;
  const rawCashback = (cashbackRate / 100) * annualSpending;
  const cap = card.cashback_cap_eur;
  const cashbackValueEur =
    cap == null ? rawCashback : Math.min(rawCashback, cap);

  // 6. Valeur des miles/points (déduite) — P2. Garde-fou : ne compte QUE si
  // l'utilisateur déclare vouloir optimiser ses points, avec facteur de réalisme.
  const rawRewards =
    (card.points_per_euro ?? 0) * (card.point_value_eur ?? 0) * annualSpending;
  const rewardsValueEur = profile.valuesRewards
    ? rawRewards * assumptions.rewardsRealizationFactor
    : 0;

  // Vue « année 1 » (prime incluse au prorata) — clé de tri.
  const netAnnualCostEur =
    grossCostEur - welcomeBonusAmortizedEur - cashbackValueEur - rewardsValueEur;
  // Vue « vitesse de croisière » (récurrent, sans la prime).
  const netAnnualCostWithoutBonusEur =
    netAnnualCostEur + welcomeBonusAmortizedEur;

  return {
    cardId: card.id,
    annualFeeEur: round2(annualFeeEur),
    fxFeeEur: round2(fxFeeEur),
    foreignWithdrawalFeeEur: round2(foreignWithdrawalFeeEur),
    grossCostEur: round2(grossCostEur),
    welcomeBonusAmortizedEur: round2(welcomeBonusAmortizedEur),
    cashbackValueEur: round2(cashbackValueEur),
    rewardsValueEur: round2(rewardsValueEur),
    netAnnualCostEur: round2(netAnnualCostEur),
    netAnnualCostWithoutBonusEur: round2(netAnnualCostWithoutBonusEur),
    assumptions,
    inputs: {
      annualSpendingEur: round2(annualSpending),
      foreignAnnualSpendingEur: round2(foreignAnnualSpending),
      foreignWithdrawalsPerYear,
    },
  };
}

/**
 * Coût annuel net de la SITUATION ACTUELLE de l'utilisateur.
 *
 * On ne connaît pas la banque : on modélise une carte de réseau traditionnelle
 * (frais de change et de retrait typiques) et on y injecte la cotisation
 * déclarée. Le résultat est un fait chiffré estimé, pas un jugement.
 */
export function computeCurrentSituationCost(
  profile: UsageProfile,
  assumptions: EngineAssumptions = DEFAULT_ASSUMPTIONS,
): CostBreakdown {
  const syntheticCurrentCard: Card = {
    id: "__situation_actuelle__",
    name: "Situation actuelle (estimée)",
    issuer: "—",
    network: "—",
    tier: "intermediaire",
    monthly_fee_eur: null,
    annual_fee_eur: profile.currentAnnualFeeEur,
    free_condition: null,
    fx_fee_percent: DEFAULT_CURRENT_SITUATION.fxFeePercent,
    foreign_withdrawal: "Modèle de frais d'une carte de réseau traditionnelle.",
    insurances_level: "premier_gold",
    cashback: null,
    miles_program: null,
    welcome_bonus_eur: 0,
    affiliate: { network: null, est_commission_eur: 0 },
    target_profiles: [],
    last_verified: null,
    source_url: "",
    foreign_withdrawal_fee_percent:
      DEFAULT_CURRENT_SITUATION.foreignWithdrawalFeePercent,
    foreign_withdrawal_flat_eur:
      DEFAULT_CURRENT_SITUATION.foreignWithdrawalFlatEur,
    free_foreign_withdrawals_per_month:
      DEFAULT_CURRENT_SITUATION.freeForeignWithdrawalsPerMonth,
    cashback_rate_percent: 0,
    min_monthly_income_eur: null,
  };
  return computeAnnualCost(syntheticCurrentCard, profile, assumptions);
}

/** Éligibilité au regard du revenu déclaré. Inconnu ⇒ éligible (transparence). */
export function isEligible(card: Card, profile: UsageProfile): boolean {
  const min = card.min_monthly_income_eur;
  if (min == null) return true;
  return profile.monthlyIncomeEur >= min;
}

export interface RankOptions {
  assumptions?: EngineAssumptions;
  /** Si true, exclut les cartes pour lesquelles le revenu est insuffisant. */
  onlyEligible?: boolean;
}

/**
 * Classe TOUTES les cartes par coût annuel net croissant.
 *
 * Tri strictement objectif : coût net, puis cotisation, puis nom (déterminisme).
 * Aucune notion de "carte pour vous". L'éligibilité est exposée par carte ;
 * elle ne réordonne le classement que si `onlyEligible` est demandé (filtrage).
 */
export function rankCards(
  cards: Card[],
  profile: UsageProfile,
  options: RankOptions = {},
): RankedCard[] {
  const assumptions = options.assumptions ?? DEFAULT_ASSUMPTIONS;
  const current = computeCurrentSituationCost(profile, assumptions);

  const rows: RankedCard[] = cards.map((card) => {
    const breakdown = computeAnnualCost(card, profile, assumptions);
    return {
      card,
      breakdown,
      eligible: isEligible(card, profile),
      savingsVsCurrentEur: round2(
        current.netAnnualCostEur - breakdown.netAnnualCostEur,
      ),
    };
  });

  const filtered = options.onlyEligible
    ? rows.filter((r) => r.eligible)
    : rows;

  return filtered.sort((a, b) => {
    const byCost = a.breakdown.netAnnualCostEur - b.breakdown.netAnnualCostEur;
    if (byCost !== 0) return byCost;
    const byFee = a.card.annual_fee_eur - b.card.annual_fee_eur;
    if (byFee !== 0) return byFee;
    return a.card.name.localeCompare(b.card.name);
  });
}

/**
 * Priorité 4 — sépare le classement en cartes accessibles (revenu suffisant) et
 * cartes nécessitant un revenu plus élevé, SANS modifier l'ordre interne. Permet
 * à l'affichage de regrouper les non éligibles dans une section dédiée plutôt que
 * de les mélanger au classement principal.
 */
export function splitByEligibility(ranked: RankedCard[]): {
  eligible: RankedCard[];
  ineligible: RankedCard[];
} {
  return {
    eligible: ranked.filter((r) => r.eligible),
    ineligible: ranked.filter((r) => !r.eligible),
  };
}

/**
 * Priorité 6 — poids relatif de chaque poste de COÛT (cotisation, change,
 * retrait) dans le coût brut, trié par montant décroissant. Permet d'expliquer
 * lisiblement pourquoi une carte premium est mal classée pour un voyageur en
 * devises (ex. « 71 % du coût vient des frais de change »).
 */
export function costComposition(breakdown: CostBreakdown): CostShare[] {
  const posts: CostShare[] = [
    { post: "cotisation", amountEur: breakdown.annualFeeEur, share: 0 },
    { post: "change", amountEur: breakdown.fxFeeEur, share: 0 },
    { post: "retrait", amountEur: breakdown.foreignWithdrawalFeeEur, share: 0 },
  ];
  const gross = breakdown.grossCostEur;
  for (const p of posts) {
    p.share = gross > 0 ? round2(p.amountEur / gross) : 0;
  }
  return posts.sort((a, b) => b.amountEur - a.amountEur);
}

/** Restreint une part à l'intervalle [0, 1]. */
function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.min(1, Math.max(0, x));
}
