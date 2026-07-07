// lib/card-compare.test.ts
// Tests de la couche pure du comparateur : données comparables, lignes
// conditionnelles (rowHasData) et surbrillance de la meilleure valeur (bestIndices).

import { describe, expect, it } from "vitest";
import {
  COMPARE_ROWS,
  bestIndices,
  buildCompareData,
  rowHasData,
} from "./card-compare";
import type { Card } from "./types";

function makeCard(over: Partial<Card> = {}): Card {
  return {
    id: "c",
    name: "Carte",
    issuer: "Banque",
    network: "Visa",
    tier: "intermediaire",
    monthly_fee_eur: null,
    annual_fee_eur: 0,
    free_condition: null,
    fx_fee_percent: 0,
    foreign_withdrawal: "Gratuit",
    insurances_level: "none",
    cashback: null,
    miles_program: null,
    welcome_bonus_eur: 0,
    affiliate: { network: null, est_commission_eur: 0 },
    target_profiles: [],
    last_verified: null,
    source_url: "",
    ...over,
  };
}

const row = (id: string) => COMPARE_ROWS.find((r) => r.id === id)!;

describe("buildCompareData — scores comparables", () => {
  it("mappe cotisation, change, revenu et retrait sur des scores (bas = mieux)", () => {
    const d = buildCompareData(
      makeCard({
        annual_fee_eur: 60,
        fx_fee_percent: 2,
        min_monthly_income_eur: 1200,
        foreign_withdrawal_fee_percent: 2,
        foreign_withdrawal_flat_eur: 1,
      }),
    );
    expect(d.feeScore).toBe(60);
    expect(d.fxScore).toBe(2);
    expect(d.incomeScore).toBe(1200);
    expect(d.withdrawalScore).toBe(3); // 2 % + 1 €
  });

  it("retrait gratuit (retraits illimités) => score 0 ; inconnu => null", () => {
    expect(
      buildCompareData(makeCard({ free_foreign_withdrawals_per_month: 100 }))
        .withdrawalScore,
    ).toBe(0);
    expect(buildCompareData(makeCard()).withdrawalScore).toBeNull();
  });

  it("sans condition de revenu => score 0 (meilleur)", () => {
    expect(buildCompareData(makeCard()).incomeScore).toBe(0);
  });

  it("compose les avantages depuis les champs vérifiés", () => {
    const d = buildCompareData(
      makeCard({
        cashback: "1 % sur tout",
        insurances_level: "premier_gold",
        welcome_bonus_eur: 80,
      }),
    );
    expect(d.perks).toHaveLength(3);
    expect(d.perks[0]).toContain("Cashback");
  });
});

describe("bestIndices — surbrillance objective", () => {
  it("surligne la valeur minimale quand il y a une différence", () => {
    const cards = [
      buildCompareData(makeCard({ id: "a", annual_fee_eur: 60 })),
      buildCompareData(makeCard({ id: "b", annual_fee_eur: 0 })),
      buildCompareData(makeCard({ id: "c", annual_fee_eur: 120 })),
    ];
    expect([...bestIndices(row("fee"), cards)]).toEqual([1]);
  });

  it("surligne toutes les cartes ex æquo sur le minimum", () => {
    const cards = [
      buildCompareData(makeCard({ id: "a", fx_fee_percent: 0 })),
      buildCompareData(makeCard({ id: "b", fx_fee_percent: 0 })),
      buildCompareData(makeCard({ id: "c", fx_fee_percent: 2 })),
    ];
    expect([...bestIndices(row("fx"), cards)]).toEqual([0, 1]);
  });

  it("ne surligne rien si toutes les valeurs sont égales", () => {
    const cards = [
      buildCompareData(makeCard({ id: "a", annual_fee_eur: 0 })),
      buildCompareData(makeCard({ id: "b", annual_fee_eur: 0 })),
    ];
    expect(bestIndices(row("fee"), cards).size).toBe(0);
  });

  it("ignore les scores inconnus et n'exige pas qu'ils soient renseignés", () => {
    const cards = [
      buildCompareData(makeCard({ id: "a", foreign_withdrawal_fee_percent: 2 })),
      buildCompareData(makeCard({ id: "b" })), // withdrawalScore null
    ];
    // Un seul score valide => pas de comparaison possible => rien de surligné.
    expect(bestIndices(row("withdrawal"), cards).size).toBe(0);
  });

  it("ne surligne jamais une ligne sans score (réseau)", () => {
    const cards = [
      buildCompareData(makeCard({ id: "a", network: "Visa" })),
      buildCompareData(makeCard({ id: "b", network: "Mastercard" })),
    ];
    expect(bestIndices(row("network"), cards).size).toBe(0);
  });
});

describe("rowHasData — lignes conditionnelles", () => {
  it("masque une ligne dont aucune carte n'a la donnée (plafond, note)", () => {
    const cards = [buildCompareData(makeCard()), buildCompareData(makeCard())];
    expect(rowHasData(row("ceiling"), cards)).toBe(false);
    expect(rowHasData(row("rating"), cards)).toBe(false);
    // Réseau et cotisation sont toujours renseignés.
    expect(rowHasData(row("network"), cards)).toBe(true);
    expect(rowHasData(row("fee"), cards)).toBe(true);
  });

  it("affiche la ligne avantages dès qu'une carte en a", () => {
    const cards = [
      buildCompareData(makeCard({ cashback: "1 %" })),
      buildCompareData(makeCard()),
    ];
    expect(rowHasData(row("perks"), cards)).toBe(true);
  });
});
