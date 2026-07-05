// lib/engine.test.ts
// Tests unitaires du moteur, organisés par priorité d'amélioration.
// Trois profils types : petit budget sédentaire, voyageur hors zone euro,
// gros dépensier optimiseur en zone euro. Aucune UI, aucun React.

import { describe, expect, it } from "vitest";
import {
  computeAnnualCost,
  computeCurrentSituationCost,
  costComposition,
  DEFAULT_ASSUMPTIONS,
  effectiveForeignShare,
  isEligible,
  rankCards,
  splitByEligibility,
} from "./engine";
import { cards as realCards } from "./cards";
import { getCard } from "./cards";
import type { Card, UsageProfile } from "./types";

// --- Cartes de test (déterministes, indépendantes du catalogue réel) ---

function makeCard(partial: Partial<Card> & Pick<Card, "id" | "name">): Card {
  return {
    issuer: "Test",
    network: "Visa",
    tier: "intermediaire",
    monthly_fee_eur: null,
    annual_fee_eur: 0,
    free_condition: null,
    fx_fee_percent: 0,
    foreign_withdrawal: "-",
    insurances_level: "basique",
    cashback: null,
    miles_program: null,
    welcome_bonus_eur: 0,
    affiliate: { network: null, est_commission_eur: 0 },
    target_profiles: [],
    last_verified: null,
    source_url: "",
    ...partial,
  };
}

/** Néo-banque gratuite : retraits gratuits illimités, prime 80€, revenu 2200€. */
const freeTravel = makeCard({
  id: "free-travel",
  name: "Free Travel",
  welcome_bonus_eur: 80,
  free_foreign_withdrawals_per_month: 999,
  min_monthly_income_eur: 2200,
});

/** Premium voyage : 119,88€, 4 retraits gratuits/mois puis 2%, prime 20€. */
const premiumTravel = makeCard({
  id: "premium-travel",
  name: "Premium Travel",
  tier: "premium",
  annual_fee_eur: 119.88,
  welcome_bonus_eur: 20,
  foreign_withdrawal_fee_percent: 2,
  free_foreign_withdrawals_per_month: 4,
});

/** Carte de réseau traditionnelle : 135€, fx 2,7%, retraits 2,9% + 3€. */
const traditional = makeCard({
  id: "traditional",
  name: "Traditional Premier",
  annual_fee_eur: 135,
  fx_fee_percent: 2.7,
  foreign_withdrawal_fee_percent: 2.9,
  foreign_withdrawal_flat_eur: 3,
});

/** Carte à cashback : 180€, fx 2,5%, prime 200€, cashback 1% plafonné 100€. */
const amexPoints = makeCard({
  id: "amex-points",
  name: "Amex Points",
  tier: "premium",
  annual_fee_eur: 180,
  fx_fee_percent: 2.5,
  welcome_bonus_eur: 200,
  foreign_withdrawal_fee_percent: 2.5,
  foreign_withdrawal_flat_eur: 4,
  cashback_rate_percent: 1,
  cashback_cap_eur: 100,
});

/** Carte à grosse prime + grosse cotisation (pour tester l'amortissement). */
const bigBonus = makeCard({
  id: "big-bonus",
  name: "Big Bonus Premium",
  annual_fee_eur: 200,
  welcome_bonus_eur: 240,
});

const allTestCards = [freeTravel, premiumTravel, traditional, amexPoints];

// --- Profils types ---

/** A. Petit budget sédentaire. */
const petitBudget: UsageProfile = {
  monthlySpendingEur: 800,
  foreignSpendingShare: 0.02,
  travelOutsideEuropePerYear: 0,
  foreignWithdrawalsPerMonth: 0,
  currentAnnualFeeEur: 45,
  valuesRewards: false,
  monthlyIncomeEur: 1500,
  profileType: "petit_budget_sedentaire",
};

/** B. Voyageur régulier hors zone euro. */
const voyageur: UsageProfile = {
  monthlySpendingEur: 2000,
  foreignSpendingShare: 0.35,
  travelOutsideEuropePerYear: 4,
  foreignWithdrawalsPerMonth: 3,
  currentAnnualFeeEur: 135,
  valuesRewards: true,
  monthlyIncomeEur: 2600,
  profileType: "voyageur_regulier",
};

/** C. Gros dépensier optimiseur, dépenses EN zone euro. */
const grosDepensier: UsageProfile = {
  monthlySpendingEur: 5000,
  foreignSpendingShare: 0.05,
  travelOutsideEuropePerYear: 1,
  foreignWithdrawalsPerMonth: 0,
  currentAnnualFeeEur: 180,
  valuesRewards: true,
  monthlyIncomeEur: 6000,
  profileType: "gros_depensier_optimiseur",
};

/* ============================ PRIORITÉ 1 ============================ */
describe("P1 : amortissement de la prime de bienvenue (défaut 3 ans)", () => {
  it("amortit la prime sur 3 ans par défaut, avec deux vues du coût", () => {
    const b = computeAnnualCost(freeTravel, voyageur);
    expect(b.welcomeBonusAmortizedEur).toBeCloseTo(26.67, 2); // 80/3
    expect(b.netAnnualCostEur).toBeCloseTo(-26.67, 2); // vue année 1
    expect(b.netAnnualCostWithoutBonusEur).toBeCloseTo(0, 2); // vitesse de croisière
  });

  it("l'horizon est paramétrable (1 an ⇒ prime pleine)", () => {
    const oneYear = computeAnnualCost(freeTravel, voyageur, {
      ...DEFAULT_ASSUMPTIONS,
      welcomeBonusAmortizationYears: 1,
    });
    expect(oneYear.welcomeBonusAmortizedEur).toBe(80);
    expect(oneYear.netAnnualCostEur).toBeCloseTo(-80, 2);
    // Amortir sur 3 ans (défaut) déduit moins ⇒ coût net plus élevé.
    expect(computeAnnualCost(freeTravel, voyageur).netAnnualCostEur).toBeGreaterThan(
      oneYear.netAnnualCostEur,
    );
  });

  it("corrige le biais : une carte chère à grosse prime redevient chère à 3 ans", () => {
    // Profil sédentaire (aucune dépense/retrait à l'étranger).
    const at3 = computeAnnualCost(bigBonus, petitBudget); // défaut 3 ans
    const at1 = computeAnnualCost(bigBonus, petitBudget, {
      ...DEFAULT_ASSUMPTIONS,
      welcomeBonusAmortizationYears: 1,
    });
    expect(at1.netAnnualCostEur).toBeLessThan(0); // à 1 an : semble "rentable"
    expect(at3.netAnnualCostEur).toBeGreaterThan(0); // à 3 ans : correctement chère
    expect(at3.netAnnualCostWithoutBonusEur).toBe(200); // récurrent = la cotisation
  });

  it("profil sédentaire : une carte gratuite ressort en tête des accessibles", () => {
    const { eligible } = splitByEligibility(rankCards(realCards, petitBudget));
    expect(eligible[0].card.annual_fee_eur).toBe(0);
    // Aucune carte premium chère ne squatte la tête du classement accessible.
    expect(eligible[0].breakdown.netAnnualCostEur).toBeLessThan(
      computeAnnualCost(bigBonus, petitBudget).netAnnualCostEur,
    );
  });
});

/* ============================ PRIORITÉ 2 ============================ */
describe("P2 : valorisation des miles/points (gated par valuesRewards)", () => {
  // Carte synthétique déterministe (indépendante du catalogue) : 1 pt/€ à 0,012 €.
  const milesCard = makeCard({
    id: "miles-card",
    name: "Miles Card",
    tier: "premium",
    annual_fee_eur: 180,
    points_per_euro: 1,
    point_value_eur: 0.012,
  });

  it("déduit la valeur des points seulement si l'utilisateur optimise", () => {
    const on = computeAnnualCost(milesCard, grosDepensier);
    const off = computeAnnualCost(milesCard, {
      ...grosDepensier,
      valuesRewards: false,
    });
    // 1 pt/€ × 0,012 € × 60000 € × 0,7 = 504 €
    expect(on.rewardsValueEur).toBeCloseTo(504, 2);
    expect(off.rewardsValueEur).toBe(0);
    expect(on.netAnnualCostEur).toBeLessThan(off.netAnnualCostEur);
    expect(on.netAnnualCostEur).toBeCloseTo(-324, 2); // 180 − 504
    expect(off.netAnnualCostEur).toBeCloseTo(180, 2); // cotisation seule
  });

  it("activer valuesRewards réduit le coût de l'Amex et améliore son rang", () => {
    // Sur données réelles, les points ne rendent PAS l'Amex la moins chère
    // (cotisation 252 € vs cartes gratuites) : on teste l'effet directionnel
    // (coût net plus bas et rang amélioré) pas une position absolue.
    const amexOn = computeAnnualCost(getCard("amex-gold")!, grosDepensier);
    const amexOff = computeAnnualCost(getCard("amex-gold")!, {
      ...grosDepensier,
      valuesRewards: false,
    });
    expect(amexOn.rewardsValueEur).toBeGreaterThan(0);
    expect(amexOn.netAnnualCostEur).toBeLessThan(amexOff.netAnnualCostEur);

    const on = rankCards(realCards, grosDepensier);
    const off = rankCards(realCards, { ...grosDepensier, valuesRewards: false });
    const rank = (rows: typeof on, id: string) =>
      rows.findIndex((r) => r.card.id === id);
    expect(rank(on, "amex-gold")).toBeLessThanOrEqual(rank(off, "amex-gold"));
  });
});

/* ============================ PRIORITÉ 3 ============================ */
describe("P3 : cohérence voyages / part hors zone euro", () => {
  it("relève (jamais ne baisse) la part hors euro selon la fréquence de voyage", () => {
    expect(effectiveForeignShare({ ...petitBudget, travelOutsideEuropePerYear: 6, foreignSpendingShare: 0.02 })).toBe(0.2);
    expect(effectiveForeignShare({ ...petitBudget, travelOutsideEuropePerYear: 4, foreignSpendingShare: 0.02 })).toBe(0.12);
    // Pas d'ajustement à la baisse : une part déjà élevée est conservée.
    expect(effectiveForeignShare({ ...voyageur, foreignSpendingShare: 0.35 })).toBe(0.35);
  });

  it("le chiffre central (dépenses hors euro) est ajusté à la hausse si incohérent", () => {
    const incoherent: UsageProfile = {
      ...petitBudget,
      monthlySpendingEur: 1000, // 12000 €/an
      travelOutsideEuropePerYear: 6,
      foreignSpendingShare: 0.02,
    };
    const coherent: UsageProfile = { ...incoherent, travelOutsideEuropePerYear: 0 };
    expect(computeAnnualCost(traditional, incoherent).inputs.foreignAnnualSpendingEur).toBe(2400); // 12000 × 0,20
    expect(computeAnnualCost(traditional, coherent).inputs.foreignAnnualSpendingEur).toBe(240); // 12000 × 0,02
  });
});

/* ============================ PRIORITÉ 4 ============================ */
describe("P4 : séparation des cartes non éligibles (affichage)", () => {
  it("le tri est inchangé, mais on peut isoler les cartes hors condition de revenu", () => {
    expect(isEligible(freeTravel, petitBudget)).toBe(false);
    const ranked = rankCards(realCards, petitBudget);
    const { eligible, ineligible } = splitByEligibility(ranked);
    expect(eligible.length + ineligible.length).toBe(ranked.length);
    // Profil à 1500 € : Fortuneo Gold (2200€) et World Elite (4000€) inaccessibles.
    const ineligibleIds = ineligible.map((r) => r.card.id);
    expect(ineligibleIds).toContain("fortuneo-gold");
    expect(ineligibleIds).toContain("fortuneo-world-elite");
    expect(eligible.every((r) => r.eligible)).toBe(true);
  });
});

/* ============================ PRIORITÉ 5 ============================ */
describe("P5 : montant moyen de retrait étranger paramétrable", () => {
  it("un retrait moyen plus élevé augmente les frais de retrait facturés", () => {
    const withdrawer: UsageProfile = { ...petitBudget, foreignWithdrawalsPerMonth: 2 };
    const at100 = computeAnnualCost(traditional, withdrawer);
    const at200 = computeAnnualCost(traditional, withdrawer, {
      ...DEFAULT_ASSUMPTIONS,
      averageForeignWithdrawalEur: 200,
    });
    expect(at100.foreignWithdrawalFeeEur).toBeCloseTo(141.6, 2); // 24 × (3 + 2,9)
    expect(at200.foreignWithdrawalFeeEur).toBeCloseTo(211.2, 2); // 24 × (3 + 5,8)
    expect(at200.foreignWithdrawalFeeEur).toBeGreaterThan(at100.foreignWithdrawalFeeEur);
  });
});

/* ============================ PRIORITÉ 6 ============================ */
describe("P6 : explication des cas contre-intuitifs (poids des postes)", () => {
  it("pour un voyageur en devises, le change domine le coût d'une Amex premium", () => {
    const foreignShopper: UsageProfile = {
      ...petitBudget,
      monthlySpendingEur: 3000, // 36000 €/an
      foreignSpendingShare: 0.5,
      travelOutsideEuropePerYear: 6,
      foreignWithdrawalsPerMonth: 0,
      valuesRewards: false,
    };
    const b = computeAnnualCost(getCard("amex-gold")!, foreignShopper);
    const shares = costComposition(b);
    expect(shares[0].post).toBe("change"); // poste dominant
    expect(shares[0].share).toBeGreaterThan(0.5);
    // fx = 2,80% × (36000 × 0,5) = 504 €
    expect(b.fxFeeEur).toBeCloseTo(504, 2);
  });
});

/* ==================== Profils types : carte en tête ==================== */
describe("carte en tête par profil (parmi les accessibles)", () => {
  it("A sédentaire ⇒ carte gratuite (cotisation 0)", () => {
    const { eligible } = splitByEligibility(rankCards(realCards, petitBudget));
    expect(eligible[0].card.annual_fee_eur).toBe(0);
  });

  it("B voyageur hors euro ⇒ carte sans frais de change en tête", () => {
    const { eligible } = splitByEligibility(rankCards(realCards, voyageur));
    expect(eligible[0].card.fx_fee_percent).toBe(0);
  });

  it("C optimiseur ⇒ une carte à points (Amex) en tête", () => {
    // Avec les données réelles, une Amex (points valorisés) domine pour un gros
    // dépensier en euros. On teste la CATÉGORIE gagnante, pas une carte précise
    // (Gold vs AF-KLM dépend des valeurs de points, susceptibles d'évoluer).
    const { eligible } = splitByEligibility(rankCards(realCards, grosDepensier));
    expect(eligible[0].card.id.startsWith("amex")).toBe(true);
    expect(eligible[0].card.points_per_euro ?? 0).toBeGreaterThan(0);
  });
});

/* ==================== Détail de calcul (3 profils) ==================== */
describe("computeAnnualCost : détails chiffrés", () => {
  it("A / carte traditionnelle : cotisation + faible fx", () => {
    const b = computeAnnualCost(traditional, petitBudget);
    expect(b.inputs.annualSpendingEur).toBe(9600);
    expect(b.fxFeeEur).toBeCloseTo(5.18, 2); // 2,7% × 192
    expect(b.foreignWithdrawalFeeEur).toBe(0);
    expect(b.netAnnualCostEur).toBeCloseTo(140.18, 2);
  });

  it("B / traditionnelle : fx + retraits explosent le coût", () => {
    const b = computeAnnualCost(traditional, voyageur);
    expect(b.fxFeeEur).toBeCloseTo(226.8, 2); // 2,7% × 8400
    expect(b.foreignWithdrawalFeeEur).toBeCloseTo(212.4, 2); // 36 × 5,9
    expect(b.netAnnualCostEur).toBeCloseTo(574.2, 2);
  });

  it("B / cashback plafonné déduit", () => {
    const b = computeAnnualCost(amexPoints, voyageur);
    expect(b.cashbackValueEur).toBe(100);
    expect(b.netAnnualCostEur).toBeCloseTo(457.33, 2); // 180+210+234−66,67−100
  });
});

/* ==================== rankCards & données réelles ==================== */
describe("rankCards : tri objectif croissant", () => {
  it("ordre déterministe (profil B) free < premium < amex < traditional", () => {
    const ranked = rankCards(allTestCards, voyageur);
    expect(ranked.map((r) => r.card.id)).toEqual([
      "free-travel",
      "premium-travel",
      "amex-points",
      "traditional",
    ]);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i].breakdown.netAnnualCostEur).toBeGreaterThanOrEqual(
        ranked[i - 1].breakdown.netAnnualCostEur,
      );
    }
  });

  it("savingsVsCurrent : positif quand la carte est moins chère que l'actuel", () => {
    const ranked = rankCards(allTestCards, voyageur);
    const current = computeCurrentSituationCost(voyageur);
    const free = ranked.find((r) => r.card.id === "free-travel")!;
    expect(free.savingsVsCurrentEur).toBeCloseTo(
      current.netAnnualCostEur - free.breakdown.netAnnualCostEur,
      2,
    );
    expect(free.savingsVsCurrentEur).toBeGreaterThan(0);
  });

  it("charge le catalogue complet (25) et le classe en ordre croissant", () => {
    expect(realCards.length).toBe(25);
    const ranked = rankCards(realCards, voyageur);
    expect(ranked.length).toBe(25);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i].breakdown.netAnnualCostEur).toBeGreaterThanOrEqual(
        ranked[i - 1].breakdown.netAnnualCostEur,
      );
    }
  });
});

/* ============================ invariants ============================ */
describe("invariants", () => {
  it("part hors euro hors [0,1] est bornée (pas de NaN, pas de négatif)", () => {
    const weird: UsageProfile = { ...petitBudget, foreignSpendingShare: 5 };
    const b = computeAnnualCost(traditional, weird);
    expect(b.fxFeeEur).toBeCloseTo(259.2, 2); // borné à 1 → 2,7% × 9600
    expect(Number.isFinite(b.netAnnualCostEur)).toBe(true);
  });
});
